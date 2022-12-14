const fs = require('fs');
const util = require('util');
const path = require('path')

const { terminalCodesToHtml } = require("terminal-codes-to-html");
const deserialize = require('./public/deserialize');
const serialize = require('./public/serialize');

const funcLoc = require('func-loc');

const { STACK_TRACE_LIMIT, IGNORED_STACK_SOURCES } = require('./constants');
const { SETTINGS, REQUESTS, FUNCTION_LOCATIONS, SSE } = require('./globals');

function delay(ms) {
	return new Promise(r => setTimeout(r, ms));
}

function getRootDirectory(){
	return path.dirname(path.resolve(SETTINGS.entryPoint)) + '/'
}

Error.stackTraceLimit = STACK_TRACE_LIMIT;

function getProjectLine(error) {
	const container = {}
	if (error) container.stack = error.stack
	else {
		let oldLimit = Error.stackTraceLimit;
		Error.stackTraceLimit = STACK_TRACE_LIMIT
		Error.captureStackTrace(container)
		Error.stackTraceLimit = oldLimit;
	}
	for (const line of (container.stack || '').split('at ').slice(1)) {
		const source = line.split('(').slice(1).join('(').split(')').slice(0, -1).join(')') || line
		if (IGNORED_STACK_SOURCES.some(ignore => source.includes(ignore))) continue;
		return source.trim().replace(getRootDirectory(), '')
	}
}


function getLinesFromFilepathWithLocation(path) {
	const filepath = path.split(':').slice(0, -2).join(':')
	const lines = path.split(':').slice(-2)[0];
	const [start, end = start + 1] = lines.split('-').map(Number);
	if (!fs.existsSync(filepath)) return undefined;
	return fs.readFileSync(filepath).toString().split('\n').slice(Math.max(0, start - 2), end);
}

async function normalizeEvent(event) {
	if (typeof event.handler === 'function' && !FUNCTION_LOCATIONS.has(event.handler)) {
		FUNCTION_LOCATIONS.set(event.handler, null);
		await funcLoc.locate(event.handler).then(loc => FUNCTION_LOCATIONS.set(event.handler, loc)).catch(() => undefined)
	}


	if (typeof event.handler === 'function') {
		event.handler = getHandlerInfo(event.handler)
	}
	return event
}


function getHandlerInfo(handler) {
	const root = getRootDirectory();
	const obj = {
		name: handler.name,
		add: handler.__r2_add_line?.replace(root, ''),
		construct: handler.__r2_construct_line?.replace(root, ''),
		code: {
			add: handler.__r2_add_line ? getLinesFromFilepathWithLocation(handler.__r2_add_line) : undefined,
			construct: handler.__r2_construct_line ? getLinesFromFilepathWithLocation(handler.__r2_construct_line) : undefined,
		}
	};
	(FUNCTION_LOCATIONS.has(handler) || handler.__r2_location ? Promise.resolve(FUNCTION_LOCATIONS.get(handler) || handler.__r2_location) : funcLoc.locate(handler).then(loc => FUNCTION_LOCATIONS.set(handler, loc).get(handler))).then(loc => {
		if (!loc || IGNORED_STACK_SOURCES.some(ignore => loc.path.includes(ignore))) return

		if (!('code' in obj)) obj.code = {};
		obj.code.location = getLinesFromFilepathWithLocation(`${loc.path}:${loc.line}-${loc.line + handler.toString().split('\n').length}:${loc.column}`)

		obj.location = loc
		delete obj.location.source;
		obj.location.path = obj.location.path.replace(root, '');
	});

	if (!Object.values(obj.code).filter(Boolean).length) delete obj.code;
	return obj;
}


function getEvaluateInfo() {
	const line = getProjectLine();
	return {
		line,
		code: line && getLinesFromFilepathWithLocation(line) || undefined
	}
}

function addRequestData(request, data) {
	const info = REQUESTS.get(request.__r2_id);
	if (!info) return;
	addInfo(info, data);
}

function addInfo(info, data){
	const replacingIndex = info.events.findIndex(e => e.start === data.start);
	if (replacingIndex !== -1) info.events.splice(replacingIndex, 1);
	info.events.push(data);
	info.events.sort((a, b) => a.start - b.start);
	if (!SSE.clients.length) return;
	SSE.backflow.push({ id: info.id, event: data });
}


function cloneButIgnore(obj, ignoredProperties, ...cloneArgs) {
	const shallow = {};
	for (const key in obj) {
		if (!ignoredProperties.some(regex => regex.test(key))) shallow[key] = obj[key];
	}

	return deserialize(serialize(shallow, { json: true }));
}

function clone(object) {
	return cloneButIgnore(object, SETTINGS.diffExcludedProperties);
}

function formattedInspect(obj){
	return util.inspect(obj, { numericSeparator: true, depth: null, maxArrayLength: null, maxStringLength: null, breakLength: 40 })
}

module.exports = { delay, getProjectLine, getLinesFromFilepathWithLocation, normalizeEvent, getHandlerInfo, getEvaluateInfo, addRequestData, clone, addInfo, formattedInspect, getRootDirectory, cloneButIgnore }