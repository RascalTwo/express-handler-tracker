const fs = require('fs');
const util = require('util');

const { terminalCodesToHtml } = require("terminal-codes-to-html");
const jestDiff = require('jest-diff');
const deserialize = require('@ungap/structured-clone').deserialize;
const serialize = require('./serialize');

const funcLoc = require('func-loc');

const { STACK_TRACE_LIMIT, IGNORED_STACK_SOURCES } = require('./constants');
const { SETTINGS, REQUESTS, FUNCTION_LOCATIONS, SSE } = require('./globals');

function delay(ms) {
	return new Promise(r => setTimeout(r, ms));
}

Error.stackTraceLimit = STACK_TRACE_LIMIT;

function getProjectLines(error) {
	const lines = []

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
		lines.push(source.trim())
	}
	return lines[0] ? [lines[0]] : [];
}


function getLinesFromFilepathWithLocation(path) {
	const filepath = path.split(':').slice(0, -2).join(':')
	const lines = path.split(':').slice(-2)[0];
	const [start, end = start + 1] = lines.split('-').map(Number);
	if (!fs.existsSync(filepath)) return undefined;
	return fs.readFileSync(filepath).toString().split('\n').slice(Math.max(0, start - 2), end);
}

async function normalizeEvent(event, previousEvents) {
	if (typeof event.handler === 'function' && !FUNCTION_LOCATIONS.has(event.handler)) {
		FUNCTION_LOCATIONS.set(event.handler, null);
		await funcLoc.locate(event.handler).then(loc => FUNCTION_LOCATIONS.set(event.handler, loc)).catch(() => undefined)
	}


	if (typeof event.handler === 'function') {
		event.handler = getHandlerInfo(event.handler, previousEvents.filter(event => typeof event.handler === 'object').map(event => event.handler))
	}
	return event
}


function getHandlerInfo(handler, previousHandlers) {
	const obj = {
		name: handler.name,
		adds: handler.__r2_add_lines,
		construct: handler.__r2_construct_lines,
		code: {
			adds: handler.__r2_add_lines?.length ? getLinesFromFilepathWithLocation(handler.__r2_add_lines[0][0]) : undefined,
			construct: handler.__r2_construct_lines ? getLinesFromFilepathWithLocation(handler.__r2_construct_lines[0]) : undefined,
		}
	};
	(FUNCTION_LOCATIONS.has(handler) || handler.__r2_location ? Promise.resolve(FUNCTION_LOCATIONS.get(handler) || handler.__r2_location) : funcLoc.locate(handler).then(loc => FUNCTION_LOCATIONS.set(handler, loc).get(handler))).then(loc => {
		if (!loc || IGNORED_STACK_SOURCES.some(ignore => loc.path.includes(ignore))) return

		obj.location = loc

		if (!('code' in obj)) obj.code = {};
		obj.code.location = getLinesFromFilepathWithLocation(`${loc.path}:${loc.line}-${loc.line + handler.toString().split('\n').length}:${loc.column}`)
	});

	if (!Object.values(obj.code).filter(Boolean).length) delete obj.code;
	return obj;
}


function getEvaluateInfo() {
	const lines = getProjectLines();
	return {
		lines,
		code: lines[0] && getLinesFromFilepathWithLocation(lines[0]) || undefined
	}
}

function addRequestData(request, data) {
	const info = REQUESTS.get(request.__r2_id);
	if (!info) return;
	addInfo(info, data);
	info.end = { request: clone(request), response: clone(request.res) }
}

function addInfo(info, data){
	data.order = info.events.length;
	const replacingIndex = info.events.findIndex(e => e.start === data.start);
	if (replacingIndex !== -1) info.events.splice(replacingIndex, 1);
	info.events.push(data);
	info.events.sort((a, b) => a.start - b.start || a.order - b.order);
	if (!SSE.clients.length) return;
	SSE.backflow.push({ id: info.id, event: data });
}


const aColor = string => '<R2_A>' + string + '</R2_A>'
const bColor = string => '<R2_B>' + string + '</R2_B>'
const commonColor = string => string
const patchColor = string => string

function generateDiffString(original, modified) {
	return jestDiff.diff(original, modified, {
		commonColor, patchColor, aColor, bColor,
		aAnnotation: 'Original',
		bAnnotation: 'Modified',
		expand: false,
		contextLines: 0,
		includeChangeCounts: true
	}).replace(/@@.*?@@\n/g, '')
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

function inspectToHTML(obj){
	return terminalCodesToHtml(util.inspect(obj, { colors: true, numericSeparator: true, depth: null, maxArrayLength: null, maxStringLength: null, breakLength: 40 }))
}

module.exports = { delay, getProjectLines, getLinesFromFilepathWithLocation, normalizeEvent, getHandlerInfo, getEvaluateInfo, addRequestData, generateDiffString, clone, addInfo, inspectToHTML }