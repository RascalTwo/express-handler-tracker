const util = require('util');

const httpMethods = require("methods")
const { terminalCodesToHtml } = require("terminal-codes-to-html");

const { clone } = require('underscore');

const { SETTINGS, REQUESTS } = require('./globals')
const { MIDDLEWARE_WAIT_TIME } = require('./constants')

const server = require('./server')
const { startSSE } = require('./sse')
const { getProjectLines, addRequestData, generateDiffString, getLinesFromFilepathWithLocation, getEvaluateInfo } = require('./helpers')

/*
const path = require('path');

const fs = require('fs')
const underscore = require('underscore');
const express = require('express');
const Flatted = require('flatted');
*/


function errorToInfo(error) {
	if (!error) return undefined;
	const lines = getProjectLines(error)
	return {
		stack: error.stack,
		lines,
		code: getLinesFromFilepathWithLocation(lines[0])
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
			const id = request.headers['x-r2-id'] || Date.now();
			REQUESTS.set(id, {
				start: { request: clone(request), response: clone(response) },
				events: [],
			})
			response.on('finish', function addFinishEvent() {
				const info = REQUESTS.get(id);
				if (!info) return;

				const finish = Date.now();
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
				const start = Date.now();
				response.__r2_redirect(status, path);
				addRequestData(request, {
					start,
					end: Date.now(),
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
				const start = Date.now()
				const actualLocals = typeof locals === 'function' ? undefined : locals;
				const actualCallback = typeof callback === 'function' ? callback : typeof locals === 'function' ? callback : (err, str) => {
					if (err) return request.next(err);
					response.send(str);
				}
				response.__r2_render(name, actualLocals, function onRenderFinish(err, html) {
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
			};
			return original
		},
		__r2_send(request, response) {

			const original = response.send;
			response.send = function send(body) {
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
			return original
		},
		__r2_json(request, response) {
			const original = response.json;
			response.json = function json(body) {
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
			return original;
		}
	}

	let originals = {};

	function before(error, request, response, next, paramValue) {
		for (const key in requestChanges) {
			if (!(key in request)) request[key] = requestChanges[key](request, response);
		}
		for (const key in responseChanges) {
			if (!(key in response)) response[key] = responseChanges[key](request, response);
		}

		if (!('__r2_start' in request)) request.__r2_start = []
		request.__r2_start.push(Date.now());

		originals = {
			request: clone(request),
			response: clone(response)
		}
		next(error);
	}

	function after(error, request, response, next, paramValue, realEnd) {
		const { __r2_start } = request;
		const start = __r2_start.pop();
		if (handler.__r2_wrapper) return next(error);

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
			end: realEnd || Date.now(),
			error: errorToInfo(error),
			type: 'middleware',
			handler,
			diffs
		});
		next(error);
	}


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
		}, MIDDLEWARE_WAIT_TIME);
	}, paramValue);
}

function wrapHandler(method, handler) {
	if (handler.name === 'router' && !('__r2_construct_lines' in handler)) console.error('Un-instrumented router found:', getProjectLines()[0]);
	if (typeof handler !== "function") throw new Error("Expected a callback function but got a " + Object.prototype.toString.call(handler));

	const wrapperObj = {};
	if (handler.length === 4) wrapperObj[handler.name] = function (err, req, res, next) {
		return returnHandler(method, handler)([err, req, res, next]);
	}
	else wrapperObj[handler.name] = function (req, res, next) {
		return returnHandler(method, handler)([req, res, next]);
	}

	wrapperObj[handler.name].__r2_wrapper = true;
	handler.__r2_add_lines = [...(handler.__r2_add_lines || []), getProjectLines()];

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
	try {
		const views = instance.get('views');
		if (views instanceof String) SETTINGS.viewsDirectory = views;
	} catch (e) { }

	if (options.entryPoint) SETTINGS.entryPoint = options.entryPoint
	if (options.port) {
		if (!options.entryPoint) console.error('options.entryPoint not set, EHT server will not be running');
		server.listen(options.port, () => console.log(`UI available at http://localhost:${options.port}/`))
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


if (require.main === module) require('./instrument')
else startSSE()