

const util = require('util');
const path = require('path');
const { diff } = require('jest-diff');
const debug = require('debug')('express-handler-tracker');
const flattenDeep = require("lodash.flattendeep");
const express = require('express');
const cors = require('cors');
const { locate } = require('func-loc');
const Flatted = require('flatted');
const clone = require('clone');
const { circularDeepEqual } = require('fast-equals');
const { cruise } = require("dependency-cruiser");
const { inspect } = require('util');
const { terminalCodesToHtml } = require("terminal-codes-to-html");

const IGNORED_STACK_SOURCES = [
	'node_modules',
	'node:internal',
	'anonymous',
	'express-handler-tracker',
	'repl:1:1',
]

Error.stackTraceLimit = 1000;

let mainFilepath;
const sseClients = [];

function getProjectLines(error) {
	const lines = []

	error = error || new Error();

	for (const line of error.stack.split('at ').slice(1)) {
		const source = line.split('(').slice(1).join('(').split(')').slice(0, -1).join(')') || line
		if (IGNORED_STACK_SOURCES.some(ignore => source.includes(ignore))) continue;
		lines.push(source.trim())
	}
	return lines;
}

const requests = new Map();

async function normalizeEvent(event) {
	if (typeof event.handler === 'function') {

		fnLocations.set(event.handler, null);
		await locate(event.handler).then(loc => fnLocations.set(event.handler, loc)).catch(() => undefined)
	}


	if (event.handler) {
		event.handler = {
			name: event.handler.name,
			adds: event.handler.__r2_add_lines,
			construct: event.handler.__r2_construct_lines,
			location: fnLocations.get(event.handler),
		}
		if (IGNORED_STACK_SOURCES.some(ignore => event.handler.location?.path.includes(ignore))) delete event.handler.location;
	}
	return event
}

const backflow = [];


(async () => {
	while (true) {
		await new Promise(r => setTimeout(r, 1000));
		const chunks = backflow.splice(0, backflow.length);
		if (!chunks.length) continue;

		for (const chunk of chunks) chunk.event = await normalizeEvent(chunk.event);

		const newRequests = {};
		for (const chunk of chunks) {
			const info = requests.get(chunk.id);
			if (!info) continue;
			if (!(chunk.id in newRequests)) newRequests[chunk.id] = { start: info.start, events: [] };
			newRequests[chunk.id].events.push(chunk.event);
			newRequests[chunk.id].events.sort((a, b) => a.start - b.start);
		}

		const json = Flatted.stringify(newRequests);
		for (const client of sseClients) client.write(`data: ${json}\n\n`);
	}
})().catch(console.error);

function addRequestData(request, data) {
	const info = requests.get(request.__r2_id);
	if (!info) return;
	info.events.push(data);
	info.events.sort((a, b) => a.start - b.start);
	//info.end = { request, response: request.res }

	if (!sseClients.length) return;
	backflow.push({ id: request.__r2_id, event: data });
}

function cloneButIgnore(obj, ignoredProperties, ...args) {
	const shallow = {};
	for (const key in obj) {
		if (!ignoredProperties.some(regex => regex.test(key))) shallow[key] = obj[key];
	}
	return clone(shallow, ...args);
}


function errorToInfo(error) {
	if (!error) return undefined;
	return {
		stack: error.stack,
		lines: getProjectLines(error)
	}
}

function wrapHandler(method, handler) {
	if (handler.name === 'router' && !('__r2_construct_lines' in handler)) {
		console.error('un-instrumented router found:', getProjectLines()[0]);
	}
	callback = () => false;
	ignoredMiddlewares = [];
	ignoredProperties = [
		'^__r2',
		'^client$',
		'^_readableState$',
		'^next$',
		'^req$',
		'^res$',
		'^socket$'
	].map(s => new RegExp(s));

	if ("function" !== typeof handler) {
		throw new Error("Expected a callback function but got a " + Object.prototype.toString.call(handler));
	}

	var handleReturn = function (args) {
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

		const { before, after } = (() => {
			let originals = {};
			let ignored = false;

			return {
				before(error, request, response, next, paramValue) {
					if (!('__r2_id' in request)) {
						request.__r2_id = request.headers['x-r2-id'] || Date.now();
						requests.set(request.__r2_id, {
							/*start: { request: cloneButIgnore(request, ignoredProperties), response: cloneButIgnore(response, ignoredProperties) },*/
							events: [],
							start: { request: { url: request.url, method: request.method } }
						})
						/*request = ObservableSlim.create(request, true, function(changes) {
							console.log('request', JSON.stringify(changes));
						});
						response = ObservableSlim.create(response, true, function(changes) {
							console.log('response', JSON.stringify(changes));
						});*/
						// Results in infinite circular calls...
					}
					if (!('__r2_redirect' in response)) {
						response.__r2_redirect = response.redirect;
						const redirect = (first, second) => {
							const path = second || first
							const status = second ? first : 302
							const start = Date.now();
							response.__r2_redirect(status, path);
							addRequestData(request, {
								start,
								end: Date.now(),
								type: 'redirect',
								evaluate_lines: getProjectLines(),
								path, status
							});
						}
						response.redirect = redirect;
					}
					if (!('__r2_render' in response)) {
						response.__r2_render = response.render;
						const render = (name, locals, callback) => {
							const start = Date.now()
							const actualLocals = typeof locals === 'function' ? undefined : locals;
							const actualCallback = typeof callback === 'function' ? callback : typeof locals === 'function' ? callback : (err, str) => {
								if (err) return request.next(err);
								response.send(str);
							}
							response.__r2_render(name, actualLocals, (err, html) => {
								addRequestData(request, {
									start,
									end: Date.now(),
									type: 'view',
									evaluate_lines: getProjectLines(),
									name: name,
									locals: {
										...(response.app.locals || {}),
										...(response.locals || {}),
										...(actualLocals || {})
									}
								});
								actualCallback(err, html);
							})
						}
						response.render = render;
					}
					if (!('__r2_send' in response)) {
						response.__r2_send = response.send;
						const send = (body) => {
							const bodyCopy = body instanceof Buffer ? body.copy() : body
							const contentType = response.get('Content-Type');
							const start = Date.now();
							response.__r2_send(body);
							addRequestData(request, {
								start,
								end: Date.now(),
								type: 'send',
								evaluate_lines: getProjectLines(),
								body: typeof body === 'object' ? inspect(bodyCopy, { numericSeparator: true, depth: null, maxArrayLength: null, maxStringLength: null, breakLength: 40 }) : bodyCopy,
								contentType
							});
						}
						response.send = send;
					}
					if (!('__r2_json' in response)) {
						response.__r2_json = response.json;
						const json = (body) => {
							const start = Date.now();
							response.__r2_json(body);
							addRequestData(request, {
								start,
								end: Date.now(),
								type: 'json',
								evaluate_lines: getProjectLines(),
								body: terminalCodesToHtml(inspect(body, { colors: true, numericSeparator: true, depth: null, maxArrayLength: null, maxStringLength: null, breakLength: 40 })),
							});
						}
						response.json = json;
					}
					if (!('__r2_start' in request)) request.__r2_start = []
					request.__r2_start.push(Date.now());
					ignored = callback(request, handler) || ignoredMiddlewares.some(regex => regex.test(handler.name));
					if (ignored) return next();

					//originals.request = cloneButIgnore(request, ignoredProperties);
					//originals.response = cloneButIgnore(response, ignoredProperties);
					next(error);
				},
				after(error, request, response, next, paramValue, realEnd) {
					const { __r2_start } = request;
					const start = __r2_start.pop();
					if (ignored) {
						addRequestData(request, {
							start,
							end: realEnd || Date.now(),
							error: errorToInfo(error),
							type: 'middleware',
							handler,
							ignored: true,
						});
						return next(error);
					}

					/*
					let requestDiff;
					const rawRequest = cloneButIgnore(request, ignoredProperties)
					try {
						requestDiff = getDiff(
							JSON.parse(stringify(originals.request)),
							JSON.parse(stringify(rawRequest)),
							true
						);
					} catch (e) {
						requestDiff = {};
					}
					let responseDiff;
					const rawResponse = cloneButIgnore(response, ignoredProperties)
					try {
						responseDiff = getDiff(
							JSON.parse(stringify(originals.response)),
							JSON.parse(stringify(rawResponse)),
							true
						);
					} catch (e) {
						responseDiff = {};
					}*/
					let requestDiff = '';
					try {
						/*
						requestDiff = diff(
							originals.request,
							cloneButIgnore(request, ignoredProperties),
							{
								commonColor: string => string,
								patchColor: string => string,
								aAnnotation: 'Original',
								aColor: string => '<R2_A>' + string + '</R2_A>',
								bAnnotation: 'Modified',
								bColor: string => '<R2_B>' + string + '</R2_B>',
								expand: false,
								contextLines: 0,
								includeChangeCounts: true
							}
						).replace(/@@.*?@@\n/g, '')*/
					} catch (e) {
						requestDiff = 'Unable to inspect'
					}
					let responseDiff = '';
					try {
						/*
						responseDiff = diff(
							originals.response,
							cloneButIgnore(response, ignoredProperties),
							{
								commonColor: string => string,
								patchColor: string => string,
								aAnnotation: 'Original',
								aColor: string => '<R2_A>' + string + '</R2_A>',
								bAnnotation: 'Modified',
								bColor: string => '<R2_B>' + string + '</R2_B>',
								expand: false,
								contextLines: 0,
								includeChangeCounts: true
							}
						).replace(/@@.*?@@\n/g, '')*/
					} catch (e) {
						responseDiff = 'Unable to inspect'
					}

					//if (Object.keys(requestDiff).length) debug(`request: ${Object.keys(requestDiff).reduce((string, key) => `${string}\n  ${key}: ${util.inspect(requestDiff[key].before, { depth: 1, colors: true, }).replace(/\n/g, '\n  ')} -> ${util.inspect(requestDiff[key].after, { depth: 1, colors: true, }).replace(/\n/g, '\n  ')}`, '')}`);
					//if (Object.keys(responseDiff).length) debug(`response: ${Object.keys(responseDiff).reduce((string, key) => `${string}\n  ${key}: ${util.inspect(responseDiff[key].before, { depth: 1, colors: true, }).replace(/\n/g, '\n  ')} -> ${util.inspect(responseDiff[key].after, { depth: 1, colors: true, }).replace(/\n/g, '\n  ')}`, '')}`);

					addRequestData(request, {
						start,
						end: realEnd || Date.now(),
						error: errorToInfo(error),
						type: 'middleware',
						handler,
						diffs: {
							request: requestDiff,
							response: responseDiff
						}
					});
					next(error);
				}
			};
		})();
		before(error, request, response, () => {
			let nextAfter = (error, newNext = next, realEnd) => {
				nextAfter = undefined;
				after(error, request, response, newNext, paramValue, realEnd);
			}

			let ret
			if (args.length === 3) ret = handler(request, response, nextAfter);
			else if (method === 'param') ret = handler(request, response, nextAfter, paramValue);
			else ret = handler(error, request, response, nextAfter);
			if (ret && typeof ret.then === 'function') return ret.then(() => nextAfter(undefined, () => undefined), err => nextAfter(err, next));
			const realEnd = Date.now();
			setTimeout(() => {
				if (!nextAfter) return
				nextAfter(undefined, () => undefined, realEnd);
			}, 2500);
		}, paramValue);
	};

	if (handler.length === 4) {
		const wrapperObj = {
			[handler.name]: function (err, req, res, next) {
				return handleReturn([err, req, res, next]);
			},
		};
		wrapperObj[handler.name].__r2_wrapper = true;
		handler.__r2_add_lines = [...(handler.__r2_add_lines || []), getProjectLines()];
		return wrapperObj[handler.name];
	}

	const wrapperObj = {
		[handler.name]: function (req, res, next) {
			return handleReturn([req, res, next]);
		},
	};
	wrapperObj[handler.name].__r2_wrapper = true;
	handler.__r2_add_lines = [...(handler.__r2_add_lines || []), getProjectLines()];

	if (handler.name === "router") {
		Object.assign(wrapperObj[handler.name], handler);
	}

	return wrapperObj[handler.name];
}

function wrapInstance(instance, options = {}) {
	try {
		const views = instance.get('views');
		if (views instanceof String) viewsDirectory = views;
	} catch (e) { }

	if (options.main) mainFilepath = options.main
	if (options.port) {
		if (!mainFilepath) console.error('options.main not set, graph will not be available');
		server.listen(options.port, () => console.log(`UI available at http://localhost:${options.port}/`))
	}
	instance.__r2_construct_lines = getProjectLines();
	const me = wrapMethods(instance);

	me.__r2_route = me.route;
	me.route = function (path) {
		return wrapMethods(me.__r2_route(path), true);
	};

	return me;
}


let viewsDirectory = 'views';


const server = express();
server.use(cors());
server.use(express.static(path.join(__dirname, 'public')));

server.get('/', function renderGraph(request, response) {
	response.redirect(request.originalUrl + 'graph');
});
server.get('/graph', (_, response) => response.sendFile(path.join(__dirname, 'public/graph/graph.html')));
server.get('/info', (_, response) => {
	const { output: { modules } } = cruise([mainFilepath], { exclude: ['node_modules', 'express-handler-tracker'] });
	response.send({ modules: modules.map(({ source, dependencies }) => ({ source, dependencies: dependencies.map(({ resolved }) => resolved) })), root: path.dirname(path.resolve(mainFilepath)) + '/', viewsDirectory });
});

server.get('/events', (_, response) => {
	response.set({
		'Cache-Control': 'no-cache',
		'Content-Type': 'text/event-stream',
		'Connection': 'keep-alive'
	});
	response.flushHeaders();
	response.write('retry: 10000\n\n');

	sseClients.push(response);
	response.on('close', () => {
		response.end();
		for (let i = sseClients.length; i >= 0; i--) {
			if (sseClients[i] === response) return sseClients.splice(i, 1);
		}
	})
})

setInterval(() => {
	for (const client of sseClients) client.write(': .\n\n')
}, 1000);

// source, dependencies, resolved
server.get('/reset', (request, response) => {
	requests.clear();
	response.redirect(request.originalUrl);
});

// Mapping of function locations
const fnLocations = new Map();
server.get('/requests', (_, res) => {
	res.set('Content-Type', 'application/json');

	// Array of locate promises
	const locates = [];

	Flatted.stringify(Object.fromEntries(requests.entries()), (key, value) => {
		if (key === 'handler' && typeof value === 'function') {
			// All unseen functions get a new locate function created that sets the value in the map when completed
			if (!fnLocations.has(value)) {
				//fnLocations.set(value, null);
				//locates.push(locate(value).then(loc => fnLocations.set(value, loc)).catch(() => undefined));
			}
			return value;
		}
		return value;
	});

	return Promise.all(locates).then(() => {
		for (const value of requests.values()) {
			for (const [i, event] of value.events.entries()) {
				if (typeof event.handler !== 'function') continue;
				// THIS MUTATES THE REQUESTS PERM
				event.handler = {
					name: event.handler.name,
					adds: event.handler.__r2_add_lines,
					construct: event.handler.__r2_construct_lines,
					location: fnLocations.get(event.handler) || undefined,
				}
				if (IGNORED_STACK_SOURCES.some(ignore => event.handler.location?.path.includes(ignore))) delete event.handler.location;
				/*
				if (event.handler.adds?.length <= 1) continue;
				const possible = event.handler.adds;
				for (let j = i - 1; j >= 0; j--){
					const prevHandler = value.events[j].handler;
					if (!prevHandler) continue

					const against = [...prevHandler.adds, [prevHandler.construct]]
					const hits = new Map();
					for (const [k, lines] of possible.entries()){
						let count = 0;
						for (const line of lines){
							for (const other of against){
								if (other.includes(line)) count++
							}
						}
						hits.set(k, count)
					}
				}*/
			}
		}
		res.send(Flatted.stringify(Object.fromEntries(requests.entries())));
	})
});

wrapInstance.server = server;
wrapInstance.wrapProxy = function wrapProxy(instance) {
	return new Proxy(instance, {
		get(target, prop, receiver) {
			//sayHelloStack();
			return Reflect.get(...arguments);
		}
	})
}

module.exports = wrapInstance;

function wrapMethods(instance, isRoute) {
	var toConcat = isRoute ? ["all"] : ["use", "all", "param"];

	var methods = require("methods").concat(toConcat);

	methods.forEach(function (method) {
		var original = "__r2_" + method;
		instance[original] = instance[method];
		instance[method] = function () {
			// Manipulating arguments directly is discouraged
			var args = new Array(arguments.length);
			for (var i = 0; i < arguments.length; ++i) {
				args[i] = arguments[i];
			}

			// Grab the first parameter out in case it's a route or array of routes.
			var first = null;
			if (
				"string" === typeof args[0] ||
				args[0] instanceof RegExp ||
				(Array.isArray(args[0]) &&
					("string" === typeof args[0][0] || args[0][0] instanceof RegExp))
			) {
				first = args[0];
				args = args.slice(1);
			}

			const wrappedArgs = flattenDeep(args).map(function (arg) {
				return wrapHandler(method, arg);
			});

			// If we have a route path or something, push it in front
			if (first) {
				wrappedArgs.unshift(first);
			}

			return instance[original].apply(this, wrappedArgs);
		};
	});

	return instance;
};

const PREFIX = 'my weird stuff';

const inspector = require("inspector");

global[PREFIX] = []
global.__r2_session;
global.__r2_post$;
async function sayHelloStack() {
	if (!global.__r2_session) {
		global.__r2_session = new inspector.Session();
		global.__r2_post = util.promisify(global.__r2_session.post).bind(global.__r2_session);
		global.__r2_session.connect();
		// This worked within the actual inspctor...
		global.__r2_session.on('Debugger.paused', res => {
			global[PREFIX].push(res.params)
			//console.log(res.params.callFrames)
			//console.log(res.params.asyncStackTrace?.callFrames)
			//console.log(res.params.asyncStackTrace?.parent)
		});
	}
	console.log(await global.__r2_post('Runtime.enable'));
	console.log(await global.__r2_post('Debugger.enable'));
	//console.log(await global.__r2_post('Debugger.pause'));
	//console.log(await global.__r2_post('Debugger.resume'));
}



function deepIsEqual(one, two) {
	if (one === two) return true;
	if (typeof one !== typeof two) return false;
	if (one === null && two !== null || one !== null && two === null) return false;
	if (typeof one === 'object') return [...new Set([...Object.keys(one), ...Object.keys(two)])].every(key => deepIsEqual(one[key], two[key]));
	return false;
}

function shallowCopyObject(obj, ignoredProperties = []) {
	const copy = {};
	for (const key in obj) {
		if (!ignoredProperties.some(regex => regex.test(key))) copy[key] = obj[key];
	}
	return copy;
}

function objectDiffs(one, two) {
	const diff = {};
	for (const key of [...new Set([...Object.keys(one), ...Object.keys(two)])]) {
		if (!circularDeepEqual(one[key], two[key])) {
			diff[key] = {
				before: one[key],
				after: two[key]
			};
		}
	}
	return diff;
}
