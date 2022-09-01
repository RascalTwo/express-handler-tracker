

const fs = require('fs')
const util = require('util');
const path = require('path');
const { cruise } = require("dependency-cruiser");
const { locate } = require('func-loc');
const { diff } = require('jest-diff');
const { terminalCodesToHtml } = require("terminal-codes-to-html");
const underscore = require('underscore');

const flattenDeep = require("lodash.flattendeep");
const express = require('express');
const cors = require('cors');
const Flatted = require('flatted');

const IGNORED_STACK_SOURCES = [
	'node_modules',
	'node:internal',
	'anonymous',
	'express-handler-tracker',
	'repl:1:1',
]

Error.stackTraceLimit = 1000;


let diffExcludedProperties = [
	'^__r2',
	'^client$',
	'^_readableState$',
	'^next$',
	'^req$',
	'^res$',
	'^socket$',
	'^host$',
	'^sessionStore$'
].map(s => new RegExp(s));

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

function getLinesFromPath(path) {
	const filepath = path.split(':').slice(0, -2).join(':')
	const [lines, col] = path.split(':').slice(-2);
	const [start, end = start + 1] = lines.split('-').map(Number);
	return fs.readFileSync(filepath).toString().split('\n').slice(Math.max(0, start - 2), end);
}

function replaceHandler(handler) {
	const location = fnLocations.get(handler)
	const obj = {
		name: handler.name,
		adds: handler.__r2_add_lines,
		construct: handler.__r2_construct_lines,
		location,
		code: {
			adds: handler.__r2_add_lines?.length ? getLinesFromPath(handler.__r2_add_lines[0][0]) : undefined,
			construct: handler.__r2_construct_lines ? getLinesFromPath(handler.__r2_construct_lines[0]) : undefined,
			location: getLinesFromPath(`${location.path}:${location.line}-${location.line + handler.toString().split('\n').length}:${location.column}`),
		}
	};
	if (IGNORED_STACK_SOURCES.some(ignore => obj.location?.path.includes(ignore))) {
		delete obj.location;
		delete obj.code.location;
	}

	if (!Object.values(obj.code).filter(Boolean).length) delete obj.code;
	return obj;
}

function getEvaluateInfo() {
	const lines = getProjectLines();
	return {
		lines,
		code: getLinesFromPath(lines[0])
	}
}

async function normalizeEvent(event) {
	if (typeof event.handler === 'function') {

		fnLocations.set(event.handler, null);
		await locate(event.handler).then(loc => fnLocations.set(event.handler, loc)).catch(() => undefined)
	}


	if (event.handler) event.handler = replaceHandler(event.handler)
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
			newRequests[chunk.id].events.sort((a, b) => a.start - b.start) || a.order - b.order;
		}

		const json = Flatted.stringify(newRequests);
		for (const client of sseClients) client.write(`data: ${json}\n\n`);
	}
})().catch(console.error);

function addRequestData(request, data) {
	const info = requests.get(request.__r2_id);
	if (!info) return;
	info.events.push({ ...data, order: info.events.length });
	info.events.sort((a, b) => a.start - b.start || a.order - b.order);
	info.end = { request: cloneButIgnore(request, diffExcludedProperties), response: cloneButIgnore(request.res, diffExcludedProperties) }

	if (!sseClients.length) return;
	backflow.push({ id: request.__r2_id, event: data });
}

function cloneButIgnore(obj, ignoredProperties, ...args) {
	const shallow = {};
	for (const key in obj) {
		if (!ignoredProperties.some(regex => regex.test(key))) shallow[key] = obj[key];
	}
	return underscore.clone(shallow, ...args);
}


function errorToInfo(error) {
	if (!error) return undefined;
	const lines = getProjectLines(error)
	return {
		stack: error.stack,
		lines,
		code: getLinesFromPath(lines[0])
	}
}

function wrapHandler(method, handler) {
	if (handler.name === 'router' && !('__r2_construct_lines' in handler)) {
		console.error('un-instrumented router found:', getProjectLines()[0]);
	}

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

			return {
				before(error, request, response, next, paramValue) {
					if (!('__r2_id' in request)) {
						request.__r2_id = request.headers['x-r2-id'] || Date.now();
						requests.set(request.__r2_id, {
							start: { request: cloneButIgnore(request, diffExcludedProperties), response: cloneButIgnore(response, diffExcludedProperties) },
							events: [],
						})
						response.on('finish', () => {
							const info = requests.get(request.__r2_id);
							if (!info) return

							const finish = Date.now();

							addRequestData(request, {
								start: finish,
								end: finish,
								type: 'finish',
								diffs: {
									request: diff(
										info.start.request,
										cloneButIgnore(request, diffExcludedProperties),
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
									).replace(/@@.*?@@\n/g, ''),
									response: diff(
										info.start.response,
										cloneButIgnore(response, diffExcludedProperties),
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
									).replace(/@@.*?@@\n/g, '')
								}
							});
						})
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
								evaluate: getEvaluateInfo(),
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
								evaluate: getEvaluateInfo(),
								body: typeof body === 'object' ? util.inspect(bodyCopy, { numericSeparator: true, depth: null, maxArrayLength: null, maxStringLength: null, breakLength: 40 }) : bodyCopy,
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
								evaluate: getEvaluateInfo(),
								body: terminalCodesToHtml(util.inspect(body, { colors: true, numericSeparator: true, depth: null, maxArrayLength: null, maxStringLength: null, breakLength: 40 })),
							});
						}
						response.json = json;
					}
					if (!('__r2_start' in request)) request.__r2_start = []
					request.__r2_start.push(Date.now());

					originals.request = cloneButIgnore(request, diffExcludedProperties);
					originals.response = cloneButIgnore(response, diffExcludedProperties);
					next(error);
				},
				after(error, request, response, next, paramValue, realEnd) {
					const { __r2_start } = request;
					const start = __r2_start.pop();
					if (handler.__r2_wrapper) {
						return next(error);
					}

					let requestDiff = '';
					try {
						requestDiff = diff(
							originals.request,
							cloneButIgnore(request, diffExcludedProperties),
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
						).replace(/@@.*?@@\n/g, '')
					} catch (e) {
						requestDiff = 'Unable to inspect'
					}
					let responseDiff = '';
					try {
						responseDiff = diff(
							originals.response,
							cloneButIgnore(response, diffExcludedProperties),
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
						).replace(/@@.*?@@\n/g, '')
					} catch (e) {
						responseDiff = 'Unable to inspect'
					}

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
	if (options.diffExcludedProperties) diffExcludedProperties = options.diffExcludedProperties.map(s => new RegExp(s));
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
				fnLocations.set(value, null);
				locates.push(locate(value).then(loc => fnLocations.set(value, loc)).catch(() => undefined));
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
				event.handler = replaceHandler(event.handler);
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
