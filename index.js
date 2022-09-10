const util = require('util');
const path = require('path');
const inspector = require("inspector");

const httpMethods = require("methods")
const funcLoc = require('func-loc');
const jsondiffpatch = require('jsondiffpatch')

const { SETTINGS, REQUESTS, FUNCTION_LOCATIONS } = require('./globals')
const { MIDDLEWARE_WAIT_TIME } = require('./constants')

const server = require('./server')
const { startSSE } = require('./sse')
const { getProjectLine, addRequestData, getLinesFromFilepathWithLocation, getEvaluateInfo, clone, getHandlerInfo, addInfo, inspectToHTML } = require('./helpers')

function errorToInfo(error) {
	if (!error) return undefined;
	const line = getProjectLine(error)
	return {
		stack: error.stack,
		line,
		code: line ? getLinesFromFilepathWithLocation(line) : undefined
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
			const id = request.headers['x-r2-id'] || start;

			const info = {
				id,
				events: [],
			}
			addInfo(info, { start: start - 1, end: start - 1,
				type: 'start',
				diffs: { request: jsondiffpatch.diff({}, clone(request)), response: jsondiffpatch.diff({}, clone(response)) }
			})
			REQUESTS.set(id, info);
			REQUESTS.set('latest', info);

			response.on('close', function addFinishEvent() {
				const info = REQUESTS.get(id);
				if (!info) return;

				for (const func of response.__r2_sync_finishes || []) func();

				const finish = performance.now();
				addRequestData(request, {
					start: finish,
					end: finish,
					type: 'finish',
					diffs: {
						request: jsondiffpatch.diff(request.__r2_last_before.request, clone(request)),
						response: jsondiffpatch.diff(request.__r2_last_before.response, clone(response)),
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
					body: typeof body === 'object' ? inspectToHTML(bodyCopy) : bodyCopy,
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
					body: inspectToHTML(body),
				});
			}
			return original;
		}
	}

	let ignored = false;
	let start;

	function before(error, request, response, next, paramValue) {
		ignored = request.__r2_ignored || SETTINGS.ignoreRequests.regexes.some(regex => (request.method + ' ' + request.url).match(regex)) || SETTINGS.ignoreRequests.callbacks.some(cb => cb(request, response))
		if (ignored) {
			request.__r2_ignored = true;
			return next(error);
		}

		start = performance.now();

		if (!request.__r2_befores) request.__r2_befores = [];

		const before = {
			request: clone(request),
			response: clone(response)
		}
		request.__r2_befores.push(request.__r2_last_before = before);

		if (!request.__r2_proxies) request.__r2_proxies = new Map();

		if (!request.__r2_id) {
			for (const key in requestChanges) {
				if (!(key in request)) request[key] = requestChanges[key](request, response);
			}
			for (const key in responseChanges) {
				if (!(key in response)) response[key] = responseChanges[key](request, response);
			}
		}
		next(error);
	}

	function after(error, request, response, next, paramValue) {
		if (ignored) return next(error);

		if (request.__r2_proxies.size) {
			for (const [start, { info, url, location }] of request.__r2_proxies.entries()) {
				request.__r2_proxies.delete(start);

				const result = proxyPromiseResults.get(info.start);
				if (result) {
					proxyPromiseResults.delete(info.start);
					Object.assign(info, result);
				}

				addRequestData(request, proxyInfoToEvent(info, url, location));
			}
		}

		if (handler.__r2_wrapper) {
			const info = REQUESTS.get(request.__r2_id)
			if (info) {
				let last;
				for (const event of [...info.events.sort((a, b) => a.order - b.order)].reverse()) {
					if (event.type === 'middleware') {
						if (event.handler?.name === handler.name) last = event;
						break
					}
				}
				if (last?.handler?.name === handler.name) {
					const accurateInfo = getHandlerInfo(handler)
					if (accurateInfo.add) {
						last.handler.add = accurateInfo.add;
						if (accurateInfo.code?.add) {
							if (!last.handler.code) last.handler.code = {}
							last.handler.code.add = accurateInfo.code.add;
						}
					}
					return next(error);
				}
			}
		}

		const originals = request.__r2_befores.pop()

		const diffs = {
			request: '',
			response: ''
		}
		for (const [key, obj] of [['request', request], ['response', response]]) {
			try {
				diffs[key] = jsondiffpatch.diff(originals[key], clone(obj))
				if (!Object.keys(diffs[key] || {}).length) diffs[key] = undefined
			} catch (e) {}
		}

		addRequestData(request, {
			start,
			end: performance.now(),
			error: errorToInfo(error),
			type: 'middleware',
			handler: getHandlerInfo(handler,),
			diffs
		});
		next(error);
	}


	before(error, request, response, () => setTimeout(() => {
		let nextAfter = (error, newNext = next) => {
			nextAfter = undefined;
			setTimeout(() => after(error, request, response, newNext, paramValue), 1);
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
	if (typeof handler !== "function") throw new Error("Expected a callback function but got a " + Object.prototype.toString.call(handler));
	if (handler.name === 'router' && !('__r2_construct_line' in handler)) console.error('Un-instrumented router found:', getProjectLine());

	const locPromise = FUNCTION_LOCATIONS.has(handler) ? Promise.resolve(FUNCTION_LOCATIONS.get(handler)) : funcLoc.locate(handler).then(loc => FUNCTION_LOCATIONS.set(handler, loc).get(handler))

	if (!('__r2_add_line' in handler)) handler.__r2_add_line = getProjectLine();
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

	handler.__r2_add_line = getProjectLine()
	locPromise.then(loc => handler.__r2_location = loc)
	wrapperObj[handler.name].__r2_wrapper = true;
	wrapperObj[handler.name].__r2_add_line = getProjectLine();

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
	if (instance.name === 'app') {
		instance.__r2_set = instance.set;
		instance.set = function set(...args) {
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
	if (options.attachAsyncProxiesToLatestRequest) SETTINGS.attachAsyncProxiesToLatestRequest = options.attachAsyncProxiesToLatestRequest;
	if (options.ignoreRequests) {
		SETTINGS.ignoreRequests = options.ignoreRequests
		if ('regexes' in SETTINGS.ignoreRequests) SETTINGS.ignoreRequests = SETTINGS.ignoreRequests.map(s => new RegExp(s));
	}


	instance.__r2_construct_line = getProjectLine();

	const wrappedInstance = wrapMethods(instance);

	wrappedInstance.__r2_route = wrappedInstance.route;
	wrappedInstance.route = path => wrapMethods(wrappedInstance.__r2_route(path), true);

	return wrappedInstance;
}

module.exports = wrapInstance;
module.exports.server = server;

function proxyInfoToEvent(info, url, location) {
	const { start, id, property, argc, argv, value, reason, end } = info
	const line = url ? (url.split('file://')[1] + ':' + (location.lineNumber + 1) + ':' + (location.columnNumber + 1)) : undefined;
	const { __r2_source: source, __r2_label: label } = proxied[id].obj
	return {
		start,
		end,
		type: 'proxy-evaluate',
		property,
		evaluate: line ? {
			line,
			code: getLinesFromFilepathWithLocation(line)
		} : undefined,
		source,
		label,
		code: getLinesFromFilepathWithLocation(source),
		args: {
			string: argv,
			count: argc
		},
		value,
		reason
	}
}


const session = new inspector.Session();
session.connect();
const send = util.promisify(session.post).bind(session);

const expressionTemplate = `
const event = EVENT;
typeof request === 'object' && request.__r2_proxies
	? request.__r2_proxies.set(event.info.start, event)
	: typeof req === 'object' && req.__r2_proxies
		? req.__r2_proxies.set(event.info.start, event)
		: typeof r === 'object' && r.__r2_proxies
			? r.__r2_proxies.set(event.info.start, event)
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

	const info = stack.pop()
	const expression = expressionTemplate.replace(/EVENT/g, util.inspect({ info, location: evaluated?.location, url: evaluated?.url }, { depth: null }));

	const promises = [];
	for (let i = possibles.length - 1; i >= 0; i--) promises.push(
		send('Debugger.evaluateOnCallFrame', {
			callFrameId: possibles[i].callFrameId, expression
		})
	)

	Promise.allSettled(promises).then(results => {
		if (SETTINGS.attachAsyncProxiesToLatestRequest && !results.find(r => r.value.result.type === 'number')) {
			const requestInfo = REQUESTS.get('latest');
			if (requestInfo.events.find(e => e.start === info.start)) return;
			addInfo(requestInfo, Object.assign(proxyInfoToEvent(info, evaluated?.url, evaluated?.location), { attachedToLatestRequest: true }))
		}
	});
});

const proxied = {};
const proxyPromiseResults = new Map();

module.exports.proxyInstrument = function (obj, label, properties = []) {
	obj.__r2_source = getProjectLine();
	obj.__r2_id = performance.now();
	obj.__r2_label = label;

	const makeHandler = properties => ({
		get(target, property, receiver) {
			if (properties.length && !properties.includes(property)) {
				return Reflect.get(target, property, receiver)
			}

			const start = performance.now();
			let value = Reflect.get(target, property, receiver);
			if (typeof value === 'function') value = new Proxy(value, {
				apply(target, thisArgument, argumentsList) {
					const info = {
						start,
						property,
						id: obj.__r2_id,
						argv: inspectToHTML(argumentsList),
						argc: argumentsList.length
					}
					const result = Reflect.apply(target, thisArgument, argumentsList);
					if (typeof result !== 'object' || typeof result.then !== 'function') {
						stack.unshift(Object.assign(info, { value: inspectToHTML(value), end: performance.now() }));
						send('Debugger.pause');
						return value;
					}

					stack.unshift(info);
					send('Debugger.pause');
					result.then = new Proxy(result.then, {
						apply(target, thisArgument, [thenFunc, catchFunc]) {
							return Reflect.apply(target, thisArgument, [value => {
								proxyPromiseResults.set(start, { value: inspectToHTML(value), end: performance.now() })
								return thenFunc(value)
							}, reason => {
								proxyPromiseResults.set(start, { reason: inspectToHTML(reason), end: performance.now() })
								return catchFunc(reason);
							}]);
						}
					})
					result.then = new Proxy(result.then, {
						apply(target, thisArgument, [catchFunc]) {
							return Reflect.apply(target, thisArgument, [reason => {
								proxyPromiseResults.set(start, { reason: inspectToHTML(reason), end: performance.now() })
								return catchFunc(reason);
							}]);
						}
					})
					return result;
				}
			})
			else {
				stack.unshift({ start, property, id: obj.__r2_id, value: inspectToHTML(value), end: performance.now() });
				send('Debugger.pause');
			}
			return value;
		},
		construct(target, args) {
			if (!properties.includes('constructor')) return new target(...args);

			const info = {
				start: performance.now(),
				property: 'constructor',
				id: obj.__r2_id,
				argv: inspectToHTML(args),
				argc: args.length
			}

			const instance = new target(...args);

			stack.unshift(Object.assign(info, { value: inspectToHTML(instance), end: performance.now() }));
			send('Debugger.pause');

			return instance;
		}
	})
	if (obj.prototype) Object.setPrototypeOf(obj.prototype, new Proxy(Object.getPrototypeOf(obj.prototype) || {}, makeHandler(properties.filter(prop => prop in obj.prototype))));
	const proxy = new Proxy(obj, makeHandler(properties))
	proxied[obj.__r2_id] = { obj, proxy };
	return proxy;
}


if (require.main === module) require('./instrument')
else {
	send('Runtime.enable').then(() => send('Debugger.enable'));
	startSSE();
}
