const util = require('util');
const path = require('path');
const inspector = require("inspector");

const httpMethods = require("methods")
const { terminalCodesToHtml } = require("terminal-codes-to-html");
const funcLoc = require('func-loc');

const { SETTINGS, REQUESTS, FUNCTION_LOCATIONS } = require('./globals')
const { MIDDLEWARE_WAIT_TIME } = require('./constants')

const server = require('./server')
const { startSSE } = require('./sse')
const { getProjectLines, addRequestData, generateDiffString, getLinesFromFilepathWithLocation, getEvaluateInfo, clone, getHandlerInfo } = require('./helpers')

function errorToInfo(error) {
	if (!error) return undefined;
	const lines = getProjectLines(error)
	return {
		stack: error.stack,
		lines,
		code: lines.length ? getLinesFromFilepathWithLocation(lines[0]) : undefined
	}
}

const returnHandler = (method, handler) => args => {
	let error, request, response, next, paramValue;
	if (args.length === 3) {
		[request, response, next] = args
	} else {
		if (method === 'param') {
			[request, response, next, paramValue] = args
		} else {
			[error, request, response, next] = args
		}
	}

	const requestChanges = {
		__r2_id(request, response) {
			const id = request.headers['x-r2-id'] || performance.now();
			REQUESTS.set(id, {
				start: { request: clone(request), response: clone(response) },
				events: [],
			})
			response.on('finish', function addFinishEvent() {
				const info = REQUESTS.get(id);
				if (!info) return;

				for (const func of response.__r2_sync_finishes || []) func();

				const finish = performance.now();
				addRequestData(request, {
					start: finish,
					end: finish,
					type: 'finish',
					diffs: {
						request: generateDiffString(info.start.request, clone(request)),
						response: generateDiffString(info.start.response, clone(response)),
					}
				});
			})
			return id
		}
	}

	const responseChanges = {
		__r2_redirect(request, response) {
			const original = response.redirect;
			response.redirect = function redirect(first, second) {
				const path = second || first
				const status = second ? first : 302
				const start = performance.now();
				response.__r2_redirect(status, path);
				addRequestData(request, {
					start,
					end: performance.now(),
					type: 'redirect',
					evaluate: getEvaluateInfo(),
					path, status
				});
			};
			return original
		},
		__r2_render(request, response) {
			const original = response.render;
			response.render = function render(name, locals, callback) {
				const start = performance.now()
				const actualLocals = typeof locals === 'function' ? undefined : locals;
				const actualCallback = typeof callback === 'function' ? callback : typeof locals === 'function' ? callback : (err, str) => {
					if (err) return request.next(err);
					response.send(str);
				}
				response.__r2_render(name, actualLocals, function onRenderFinish(err, html) {
					addRequestData(request, {
						start,
						end: performance.now(),
						type: 'view',
						evaluate: getEvaluateInfo(),
						name: name,
						locals: {
							...(response.app.locals || {}),
							...(response.locals || {}),
							...(actualLocals || {})
						}
					});
					actualCallback(err, html);
				})
			};
			return original
		},
		__r2_send(request, response) {

			const original = response.send;
			response.send = function send(body) {
				const bodyCopy = body instanceof Buffer ? body.copy() : body
				const contentType = response.get('Content-Type');
				const start = performance.now();
				response.__r2_send(body);
				addRequestData(request, {
					start,
					end: performance.now(),
					type: 'send',
					evaluate: getEvaluateInfo(),
					body: typeof body === 'object' ? util.inspect(bodyCopy, { numericSeparator: true, depth: null, maxArrayLength: null, maxStringLength: null, breakLength: 40 }) : bodyCopy,
					contentType
				});
			}
			return original
		},
		__r2_json(request, response) {
			const original = response.json;
			response.json = function json(body) {
				const start = performance.now();
				response.__r2_json(body);
				addRequestData(request, {
					start,
					end: performance.now(),
					type: 'json',
					evaluate: getEvaluateInfo(),
					body: terminalCodesToHtml(util.inspect(body, { colors: true, numericSeparator: true, depth: null, maxArrayLength: null, maxStringLength: null, breakLength: 40 })),
				});
			}
			return original;
		}
	}

	let originals = {};
	let start;

	function before(error, request, response, next, paramValue) {
		if (!request.__r2_proxies) request.__r2_proxies = [];

		for (const key in requestChanges) {
			if (!(key in request)) request[key] = requestChanges[key](request, response);
		}
		for (const key in responseChanges) {
			if (!(key in response)) response[key] = responseChanges[key](request, response);
		}

		start = performance.now();

		originals = {
			request: clone(request),
			response: clone(response)
		}
		next(error);
	}

	function after(error, request, response, next, paramValue, realEnd) {
		if (request.__r2_proxies.length) {
			const count = request.__r2_proxies.length;
			const proxies = [...request.__r2_proxies];
			request.__r2_proxies.splice(0, count);
			for (const { info: { when, id, property }, url, location } of proxies) {
				const line = url ? (url.split('file://')[1] + ':' + (location.lineNumber + 1) + ':' + (location.columnNumber + 1)) : undefined;
				const { __r2_source: source, __r2_label: label } = proxied[id].obj
				addRequestData(request, {
					start: when,
					end: performance.now(),
					type: 'proxy-evaluate',
					property,
					evaluate: line ? {
						lines: [line],
						code: getLinesFromFilepathWithLocation(line)
					} : undefined,
					source,
					label,
					code: getLinesFromFilepathWithLocation(source)
				});
			}
		}

		if (handler.__r2_wrapper) {
			const info = REQUESTS.get(request.__r2_id)
			if (info) {
				let last;
				for (const event of [...info.events.sort((a, b) => a.order - b.order)].reverse()){
					if (event.type === 'middleware'){
						if (event.handler?.name === handler.name) last = event;
						break
					}
				}
				if (last?.handler?.name === handler.name) {
					const accurateInfo = getHandlerInfo(handler, info.events.filter(event => typeof event.handler === 'object').map(event => event.handler))
					if (accurateInfo.adds.length && accurateInfo.adds[0].length) {
						last.handler.adds = accurateInfo.adds;
						if (accurateInfo.code?.adds) {
							if (!last.handler.code) last.handler.code = {}
							last.handler.code.adds = accurateInfo.code.adds;
						}
					}
					return next(error);
				}
			}
		}

		const diffs = {
			request: '',
			response: ''
		}
		for (const [key, obj] of [['request', request], ['response', response]]){
			try {
				diffs[key] = generateDiffString(originals[key], clone(obj))
			} catch (e) {
				diffs[key] = 'Unable to inspect'
			}
		}

		addRequestData(request, {
			start,
			end: realEnd || performance.now(),
			error: errorToInfo(error),
			type: 'middleware',
			handler: getHandlerInfo(handler, REQUESTS.get(request.__r2_id).events.filter(event => typeof event.handler === 'object').map(event => event.handler)),
			diffs
		});
		next(error);
	}


	before(error, request, response, () => setTimeout(() => {
		let nextAfter = (error, newNext = next, realEnd) => {
			nextAfter = undefined;
			setTimeout(() => after(error, request, response, newNext, paramValue, realEnd), 1);
		}

		const finishHandler = () => {
			if (!nextAfter) return
			nextAfter(undefined, () => undefined, undefined);
		}

		let ret
		if (args.length === 3) ret = handler(request, response, nextAfter);
		else if (method === 'param') ret = handler(request, response, nextAfter, paramValue);
		else ret = handler(error, request, response, nextAfter);

		if (ret && typeof ret.then === 'function') return ret.then(() => nextAfter(undefined, () => undefined), err => nextAfter(err, next));

		response.__r2_sync_finishes = [...(response.__r2_sync_finishes || []), finishHandler]
		setTimeout(finishHandler, MIDDLEWARE_WAIT_TIME);
	}, 1), paramValue);
}

function wrapHandler(method, handler) {
	if (handler.name === 'router' && !('__r2_construct_lines' in handler)) console.error('Un-instrumented router found:', getProjectLines()[0]);
	if (typeof handler !== "function") throw new Error("Expected a callback function but got a " + Object.prototype.toString.call(handler));

	const locPromise = FUNCTION_LOCATIONS.has(handler) ? Promise.resolve(FUNCTION_LOCATIONS.get(handler)) : funcLoc.locate(handler).then(loc => FUNCTION_LOCATIONS.set(handler, loc).get(handler))

	if (!('__r2_add_lines' in handler)) handler.__r2_add_lines = [...(handler.__r2_add_lines || []), getProjectLines()];
	else {
		const oldHandler = handler;
		const evalWrapper = handler.length === 4 ? {
			[handler.name]: function (err, req, res, next) {
				return oldHandler(err, req, res, next);
			}
		} : {
			[handler.name]: function (req, res, next) {
				return oldHandler(req, res, next);
			}
		}
		handler = evalWrapper[handler.name];
		handler.__r2_wrapper = true;
		locPromise.then(loc => handler.__r2_location = loc)
	}

	let wrapperObj = {};
	if (handler.length === 4) wrapperObj = {
		[handler.name]: function (err, req, res, next) {
			return returnHandler(method, handler)([err, req, res, next]);
		}
	}
	else wrapperObj = {
		[handler.name]: function (req, res, next) {
			return returnHandler(method, handler)([req, res, next]);
		}
	}

	handler.__r2_add_lines = [...(handler.__r2_add_lines || []), getProjectLines()];
	locPromise.then(loc => handler.__r2_location = loc)
	wrapperObj[handler.name].__r2_wrapper = true;
	wrapperObj[handler.name].__r2_add_lines = [...(wrapperObj[handler.name].__r2_add_lines || []), getProjectLines()];

	if (handler.name === "router") Object.assign(wrapperObj[handler.name], handler);

	return wrapperObj[handler.name];
}

function wrapMethods(instance, isRoute) {
	for (const method of httpMethods.concat(isRoute ? ["all"] : ["use", "all", "param"])) {
		const originalKey = "__r2_" + method;
		instance[originalKey] = instance[method];
		instance[method] = function (...args) {
			// Extract first value if string, aka if route path
			let first = null;
			if (typeof args[0] === 'string' || args[0] instanceof RegExp || (Array.isArray(args[0]) && (typeof args[0][0] === "string" || args[0][0] instanceof RegExp))) {
				first = args[0];
				args = args.slice(1);
			}

			const wrappedArgs = args.flat(Infinity).map(arg => wrapHandler(method, arg));
			// Throw out first string argument
			if (first) wrappedArgs.unshift(first);

			return instance[originalKey].apply(this, wrappedArgs);
		};
	}

	return instance;
};


function wrapInstance(instance, options = {}) {
	if (instance.name === 'app'){
		instance.__r2_set = instance.set;
		instance.set = function set(...args){
			const [setting, val] = args;
			if (typeof val !== 'string') return instance.__r2_set(...args)
			else if (setting === 'views') SETTINGS.views.directory = val;
			else if (setting === 'view engine') SETTINGS.views.extension = val;
			return instance.__r2_set(...args)
		}

		SETTINGS.views.directory = instance.get('views');
		SETTINGS.views.extension = instance.get('view engine');
	}

	if (options.entryPoint) SETTINGS.entryPoint = options.entryPoint
	if (options.port) {
		if (!options.entryPoint) console.error('options.entryPoint not set, EHT server will not be running');
		server.listen(options.port, () => console.log(`EHT available at http://localhost:${options.port}/`))
	}
	if (options.diffExcludedProperties) SETTINGS.diffExcludedProperties = options.diffExcludedProperties.map(s => new RegExp(s));


	instance.__r2_construct_lines = getProjectLines();

	const wrappedInstance = wrapMethods(instance);

	wrappedInstance.__r2_route = wrappedInstance.route;
	wrappedInstance.route = path => wrapMethods(wrappedInstance.__r2_route(path), true);

	return wrappedInstance;
}

module.exports = wrapInstance;
module.exports.server = server;



const session = new inspector.Session();
session.connect();
const send = util.promisify(session.post).bind(session);

const expressionTemplate = `
const event = EVENT;
typeof request === 'object' && request.__r2_proxies
	? request.__r2_proxies.push(event)
	: typeof req === 'object' && req.__r2_proxies
		? req.__r2_proxies.push(event)
		: typeof r === 'object' && r.__r2_proxies
			? r.__r2_proxies.push(event)
			: false;
`.trim();

const stack = [];

let paused = false;
session.on('Debugger.resumed', () => paused = false)
// Keep this callback as fast as possible, evaluateOnCallFrame can't be executed if the debugger unpauses which cannot be halted
session.on('Debugger.paused', ({ params: { callFrames } }) => {
	paused = true;

	const root = 'file://' + path.dirname(path.resolve(SETTINGS.entryPoint)) + '/';

	const possibles = []
	let evaluated;
	for (const frame of callFrames) {
		if (!frame.url.startsWith(root)) continue;
		if (!frame.url.includes('node_modules')) evaluated = frame;
		possibles.push(frame);
	}

	const expression = expressionTemplate.replace(/EVENT/g, util.inspect({ info: stack.pop(), location: evaluated?.location, url: evaluated?.url }, { depth: null }));
	(async () => {
		for (let i = possibles.length - 1; i >= 0; i--) {
			if (!paused) continue;
			if ((await send('Debugger.evaluateOnCallFrame', {
				callFrameId: possibles[i].callFrameId, expression
			})).result.type === 'number') break
		}
	})();
});

const proxied = {};

module.exports.proxyInstrument = function (obj, label, properties) {
	obj.__r2_source = getProjectLines()[0];
	obj.__r2_id = performance.now();
	obj.__r2_label = label;
	const proxy = new Proxy(obj, {
		get(target, property, receiver) {
			if (properties.length ? properties.includes(property) : true) {
				stack.unshift({ when: performance.now(), property, id: target.__r2_id });
				send('Debugger.pause');
			}
			return Reflect.get(target, property, receiver);
		}
	})
	proxied[obj.__r2_id] = { obj, proxy };
	return proxy;
}


if (require.main === module) require('./instrument')
else {
	send('Runtime.enable').then(() => send('Debugger.enable', { maxScriptsCacheSize: 100000000 }));
	startSSE();
}
