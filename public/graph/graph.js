import { LAYOUTS } from './constants.js'

import { generateStylesheet, renderStyleRules, updateStyles } from './style-rules.js'
import { sourceLineToID, generateViewName, generateEventURLs, generateEventCodeHTML, generateEventLabel, generateProxyCallLabel } from './helpers.js'
import { setupEventSource } from './sse.js';

import { animationDuration } from './animation-duration.js';

import './theme.js';

import { modules, root, views, requests, renderInfo, VERSION } from './globals.js'

let compoundNodes = document.querySelector('#groups').checked
document.querySelector('#groups').addEventListener('change', e => {
	compoundNodes = e.currentTarget.checked;
	cy.json({ elements: generateElements() });
	cy.style(generateStylesheet());
	renderBubbles();
	renderRequestPath()
})

let allEdges = document.querySelector('#allEdges').checked;
document.querySelector('#allEdges').addEventListener('change', e => {
	allEdges = e.currentTarget.checked;
	renderRequestPath();
})

let allNodes = document.querySelector('#allNodes').checked;
document.querySelector('#allNodes').addEventListener('change', e => {
	allNodes = e.currentTarget.checked;
	renderRequestPath();
})

let eventNumbers = document.querySelector('#eventNumbers').checked
document.querySelector('#eventNumbers').addEventListener('change', e => {
	eventNumbers = e.currentTarget.checked;
	renderRequestPath()
})


let eventHighlights = document.querySelector('#eventHighlights').checked
document.querySelector('#eventHighlights').addEventListener('change', e => {
	eventHighlights = e.currentTarget.checked;
	renderRequestPath()
})

setupEventSource(requests, () => {
	if (!renderInfo.request) renderInfo.request = Object.values(requests)[0]
	renderRequest()
	renderRequestsSelect();
	renderMiddlewaresSelect();
})


function generateElements() {
	const parents = {};
	const elements = modules.map(mod => {
		const parentNames = mod.source.split('/').slice(0, -1).reverse()
		for (let i = 0; i < parentNames.length; i++) {
			const current = parentNames[i];
			const next = parentNames[i + 1];
			if (!(current in parentNames)) parents[current] = { data: { id: current, label: current, parent: next }, classes: 'group parent-' + current }
		}
		const label = mod.source.split('/').at(-1)
		return {
			data: { id: mod.source, parent: compoundNodes ? parentNames[0] : undefined, label, baseLabel: label, href: `vscode://file${root}${mod.source}` },
			classes: parentNames[0] ? 'parent-' + parentNames[0] : undefined
		}
	})
	for (const mod of modules) {
		for (const dep of mod.dependencies) {
			elements.push({
				data: {
					id: `${mod.source}-${dep}`,
					source: mod.source,
					target: dep,
					arrow: 'triangle',
				}
			})
		}
	}
	const foundViews = {}
	for (const req of Object.values(requests)) {
		for (const event of req.events) {
			if (event.type === 'view') {
				const caller = event.evaluate.line && sourceLineToID(elements, event.evaluate.line)
				const label = generateViewName(event.name)
				const id = views.directory + '/' + label
				foundViews[event.name] = {
					data: { id, label, baseLabel: label, parent: compoundNodes && views.directory },
					classes: 'parent-' + views.directory
				}
				if (caller) {
					elements.push({ data: { id: `${caller.data.id}-${id}`, source: caller.data.id, target: id, arrow: 'triangle' }, classes: 'group' })
				}
			}
		}
	}
	if (Object.values(foundViews)) {
		elements.push(...Object.values(foundViews))
		if (compoundNodes) elements.push({ data: { id: views.directory, label: views.directory }, classes: `parent-${views.directory} group` })
	}
	if (compoundNodes) elements.push(...Object.values(parents))
	return elements;
}



window.cy = cytoscape({
	container: document.getElementById('cy-div'),
	elements: generateElements(),
	layout: Object.values(LAYOUTS)[0],
	wheelSensitivity: 0.05
});
window.cy.style(generateStylesheet())
for (const [id, { x, y }] of Object.entries(JSON.parse(localStorage.getItem('locations') || '{}')).sort((a, b) => a[0].split('/').length - b[0].split('/').length)) {
	cy.$(`[id="${id}"]`).position({ x, y });
}
(() => {
	const { zoom, pan } = JSON.parse(localStorage.getItem('info') || '{}');
	if (zoom) cy.zoom(zoom);
	if (pan) cy.pan(pan);
})();

cy.on('dbltap', 'node', function () {
	const url = this.data('href')
	if (url) window.location.href = url
});
const locations = (() => {
	const locs = JSON.parse(localStorage.getItem('locations') || '{}');
	return {
		update(id, newLoc) {
			locs[id] = newLoc
			localStorage.setItem('locations', JSON.stringify(locs))
		}
	}
})();
cy.on('free', function ({ target }) {
	locations.update(target.data('id'), target.position())
});
cy.on('pan', function () {
	const info = JSON.parse(localStorage.getItem('info') || '{}')
	info.pan = cy.pan()
	localStorage.setItem('info', JSON.stringify(info))
	if (!renderInfo.lastNode) return;
	renderInfo.tip.setProps({ getReferenceClientRect: renderInfo.lastNode.popperRef().getBoundingClientRect })
});
cy.on('zoom', function () {
	const info = JSON.parse(localStorage.getItem('info') || '{}')
	info.zoom = cy.zoom()
	localStorage.setItem('info', JSON.stringify(info))
});

const bb = cy.bubbleSets();
function renderBubbles() {
	bb.getPaths().forEach(b => bb.removePath(b))
	if (compoundNodes) return;
	const options = {
		virtualEdges: false,
		interactive: false,
		includeLabels: true,
		includeMainLabels: true,
		includeOverlays: true,
		includeSourceLabels: true,
		includeTargetLabels: true, virtualEdges: true, interactive: true,
	}

	if (!renderInfo.request) return;
	const ids = new Set();
	for (const event of renderInfo.request.events) {
		const urls = generateEventURLs(event)
		const remaining = [...'added evaluated construct source error'.split` `.map(key => urls[key]).filter(Boolean).map(u => u.split('//').at(-1)).reverse(), ...(event.type === 'view' ? [views.directory + '/' + generateViewName(event.name)] : [])];

		for (const url of remaining) {
			const target = sourceLineToID(Object.values(cy.elements()).map(cye => {
				if (typeof cye?.data === 'function') return { data: cye.data() }
				else return { data: {} }
			}), url)
			if (target) ids.add(target?.data.id)
		}
	}

	const nodes = cy.filter(e => ids.has(e.data('id')));

	const eids = new Set();
	for (const from of nodes) {
		for (const to of nodes) {
			eids.add(`${from.data('id')}-${to.data('id')}`)
		}
	}
	const edges = cy.filter(e => eids.has(e.data('id')))

	bb.addPath(nodes, edges, null, { ...options, virtualEdges: false })
}

const select = document.querySelector('#layout-options');
select.appendChild(Object.entries(LAYOUTS).reduce((frag, [value, data], i) => {
	const option = document.createElement('option');
	option.textContent = value;
	if (!i) option.selected = true;

	frag.appendChild(option)
	return frag;
}, document.createDocumentFragment()))
select.addEventListener('change', (e) => {
	const value = e.currentTarget.value;
	cy.layout(LAYOUTS[value]).run()
})

document.querySelectorAll('[id^="toggleButton"]').forEach(b => b.addEventListener('click', () => {
	const window = b.closest('.window');
	const body = JSON.parse(window.dataset.body)
	body.type = body.type === 'textContent' ? 'innerHTML' : 'textContent'
	window.dataset.body = JSON.stringify(body);
	const title = JSON.parse(window.dataset.title)
	title.type = title.type === 'textContent' ? 'innerHTML' : 'textContent'
	window.dataset.title = JSON.stringify(title);

	updateWindowHTML(window, body, title);
}));

function updateWindowHTML(window, body, title) {
	if (body !== undefined) {
		const content = window.querySelector('.mainWindow')

		if (body.type === 'diff') {
			content.innerHTML = jsondiffpatch.formatters.html.format(body.data.delta, body.data.original)
			jsondiffpatch.formatters.html.hideUnchanged();
		} else {
			let pre = content.querySelector(':scope > pre');
			if (!pre) {
				content.innerHTML = ''
				pre = document.createElement('pre');
				content.appendChild(pre);
			}

			if (body.type === 'code') pre.innerHTML = '<code>' + hljs.highlightAuto(body.string).value + '</code>';
			else pre.innerHTML = body.type === 'innerHTML' ? body.string : escapeHtml(body.string);
		}

	}
	if (title !== undefined) window.querySelector('.windowTitle')[title.type] = title.string;
}

/**
 * @param {number} id
 * @param {Record<'content' | 'title', { type: 'textContent' | 'innerHTML' | 'code' | 'diff', string: 'string', data?: any } | string>} data
 */
function renderWindow(id, { title, body }) {
	if (typeof body === 'string') body = { type: 'innerHTML', string: body }
	if (typeof title === 'string') title = { type: 'innerHTML', string: title }
	const window = document.querySelector(`#window${id}`);
	window.dataset.body = JSON.stringify(body);
	window.dataset.title = JSON.stringify(title);
	updateWindowHTML(window, body, title)
}

function generateEventNodes(event, forward) {
	const nodes = [];

	const urls = generateEventURLs(event)
	const remaining = [...(event.type === 'view' ? [views.directory + '/' + generateViewName(event.name)] : []), ...'added evaluated construct source error'.split` `.map(key => urls[key]).filter(Boolean).map(u => u.split('//').at(-1)).reverse()];
	if (!renderInfo.forward) remaining.reverse();

	while (remaining.length) {
		const url = remaining.pop()
		const target = sourceLineToID(Object.values(cy.elements()).map(cye => {
			if (typeof cye?.data === 'function') return { data: cye.data() }
			else return { data: {} }
		}), url)

		const node = cy.filter(e => e.data('id') === target?.data.id)[0];
		if (node) nodes.push(node)
	}

	return nodes;
}

function generateEventTooltipContent(event, urls){
	let content = document.createElement('div');

	content.innerHTML = generateEventLabel(event);
	content.innerHTML += '<br/>' + Object.entries(urls).filter(([_, url]) => url && !url.includes('node_modules') && !url.includes('express-handler-tracker')).reduce((lines, [name, url]) => [...lines, `<a href="${url}">${name[0].toUpperCase() + name.slice(1)}</a>`], []).join('<br/>')

	return content;
}

async function renderMiddleware() {
	if (!renderInfo.request) return
	document.querySelector('#events').value = renderInfo.middlewareIndex;

	document.querySelector('#event-small').textContent = `${renderInfo.middlewareIndex + 1}/${renderInfo.request.events.length}`
	const event = renderInfo.request.events[renderInfo.middlewareIndex]
	const duration = event.start - renderInfo.request.id
	document.querySelector('meter').value = duration
	document.querySelector('#meter-wrapper').childNodes[0].nodeValue = (+duration.toFixed(0)).toLocaleString() + 'ms'
	document.querySelector('progress').value = renderInfo.middlewareIndex + 1
	document.querySelector('#progress-wrapper').childNodes[0].nodeValue = renderInfo.middlewareIndex + 1
	if (event.diffs) {
		for (const [i, key] of ['request', 'response'].entries()){
			if (!event.diffs[key]) {
				renderWindow(i + 1, { title: key[0].toUpperCase() + key.slice(1), body: '' });
				continue;
			}
			let original
			for (let i = 0; i <= renderInfo.middlewareIndex; i++){
				const delta = renderInfo.request.events[i].diffs?.[key];
				if (!delta) continue;

				if (!original) original = deserialize(serialize(delta));
				else try { jsondiffpatch.patch(original, deserialize(serialize(delta)))}
				catch(e) { console.error(e, original, delta, e) }
			}
			renderWindow(i + 1, { title: key[0].toUpperCase() + key.slice(1), body: {type: 'diff', data: { original, delta: event.diffs[key] } } });
		}
	} else if (event.type === 'redirect') {
		renderWindow(1, { body: '' })
		renderWindow(2, { title: 'Redirected', body: event.path })
	} else if (event.type === 'view') {
		renderWindow(1, { body: '' })
		renderWindow(2, { title: event.name + ' view', body: { type: 'code', string: event.locals ? JSON.stringify(event.locals, undefined, '  ') : '{}' } });
	} else if (event.type === 'send') {
		renderWindow(1, { body: '' })
		renderWindow(2, { title: 'Response Body', body: { type: 'code', string: event.body } });
	} else if (event.type === 'json') {
		renderWindow(1, { body: '' })
		renderWindow(2, { title: 'Response JSON', body: event.body });
	} else if (event.type === 'proxy-evaluate') {
		renderWindow(1, event.args?.string ? { title: 'Arguments', body: generateProxyCallLabel(event, event.args.string.slice(1, -1)) } : { body: '' })
		renderWindow(2, { title: 'Result', body: event.reason || event.value });
	}

	const urls = generateEventURLs(event)
	const remaining = [...(event.type === 'view' ? [views.directory + '/' + generateViewName(event.name)] : []), ...'added evaluated construct source error'.split` `.map(key => urls[key]).filter(Boolean).map(u => u.split('//').at(-1)).reverse()];
	if (!renderInfo.forward) remaining.reverse()

	const w5 = document.querySelector('#window5 pre')
	w5.innerHTML = generateEventCodeHTML(event);
	attachRenderListeners(w5)

	const currentInAll = document.querySelector(`details[data-event-id="${event.start}"]`)
	if (currentInAll) {
		currentInAll.open = true;
		currentInAll.scrollIntoView({ behavior: 'smooth' });
		document.querySelectorAll('details.highlighted-event').forEach(e => e.classList.remove('highlighted-event'));
		currentInAll.classList.add('highlighted-event');
	}

	const remainingNodes = generateEventNodes(event).reverse()
	if (!renderInfo.forward) remainingNodes.reverse()

	if (!remainingNodes.length) remainingNodes.push(renderInfo.lastNode)

	disableButtons()
	while (remainingNodes.length) {
		const target = remainingNodes.pop()

		let node = target
		if (node) renderInfo.lastNode = node;
		else node = renderInfo.lastNode;

		if (!node) continue;

		/*const nextReq = renderInfo.request.events[renderInfo.middlewareIndex + (renderInfo.forward ? 1 : -1)]
		if (nextReq) {
			const nextNodes = generateEventNodes(renderInfo.request.events[renderInfo.middlewareIndex + (renderInfo.forward ? 1 : -1)], renderInfo.forward);
			const otherNodeIDs = nextNodes.map(n => n.data('id'))
			const edgeIDs = new Set(otherNodeIDs.flatMap(id => [`${node.data('id')}-${id}`, `${id}-${node.data('id')}`]))
			node.connectedEdges().filter(e => edgeIDs.has(e.data('id'))).addClass('next-edge')
		}*/

		let ref = node.popperRef(); // used only for positioning
		// A dummy element must be passed as tippy only accepts dom element(s) as the target
		// https://atomiks.github.io/tippyjs/v6/constructor/#target-types
		let dummyDomEle = document.querySelector('#tooltippy');

		if (!renderInfo.tip) renderInfo.tip = new tippy(dummyDomEle, { // tippy props:
			getReferenceClientRect: ref.getBoundingClientRect, // https://atomiks.github.io/tippyjs/v6/all-props/#getreferenceclientrect
			trigger: 'manual', // mandatory, we cause the tippy to show programmatically.
			allowHTML: true,
			appendTo: document.body,
			interactive: true,
			placement: 'bottom',
			hideOnClick: false,
			duration: [0, 0],
			zIndex: 50,

			// your own custom props
			// content prop can be used when the target is a single element https://atomiks.github.io/tippyjs/v6/constructor/#prop
			content: generateEventTooltipContent.bind(null, event, urls)
		})
		else {
			function percentileDiff(a, b, percent) {
				return (b - a) * percent + a
			}
			const from = renderInfo.tip.props.getReferenceClientRect()
			const to = ref.getBoundingClientRect()
			if (JSON.stringify(from) !== JSON.stringify(to)) {
				const steps = animationDuration ? 50 : 1;
				for (let i = 1; i <= steps; i++) {
					setTimeout(() => {
						renderInfo.tip.setProps({
							getReferenceClientRect: () => {
								const updated = {};
								for (const key in from) {
									updated[key] = percentileDiff(from[key], to[key], i / steps)
								}
								return updated;
							}
						})
					}, i * (animationDuration / steps))
				}
			}

			renderInfo.tip.setContent(generateEventTooltipContent(event, urls))
			if (JSON.stringify(from) !== JSON.stringify(to)) await new Promise(r => setTimeout(r, animationDuration));
		}
		renderInfo.tip.show();
	}
	enableButtons()
}

const requestSelect = document.querySelector('#requests');

function generateRequestLabel(request) {
	return request.label || (request.events[0].diffs.request.method + ' ' + request.events[0].diffs.request.url);
}

function renderRequestsSelect() {
	const selected = requestSelect.value;
	requestSelect.innerHTML = '';
	requestSelect.appendChild(Object.entries(requests).reduce((frag, [value, request], i) => {
		const option = document.createElement('option');
		option.value = value;
		option.textContent = generateRequestLabel(request)
		if (!i && !selected) option.selected = true;
		else if (selected == option.value) option.selected = true;

		frag.appendChild(option)
		return frag;
	}, document.createDocumentFragment()))
}
renderRequestsSelect()

function deleteRequest(id){
	const request = requests[id];
	const index = Object.values(requests).findIndex(r => r.id === request.id)
	delete requests[request.id]
	if (renderInfo.request.id === id) renderInfo.request = Object.values(requests)[index] || Object.values(requests)[index - 1] || Object.values(requests)[0];
	if (requestSelect.value == id) requestSelect.value = renderInfo.request.id;
	renderRequestsSelect()
	renderMiddlewaresSelect()
	renderRequest()
	renderMiddleware()
	fetch('../delete-request/' + request.id).catch(console.error);
}

document.querySelector('#delete-request').addEventListener('click', () => {
	if (renderInfo.request) deleteRequest(renderInfo.request.id);
})


function changeMiddleware(nth) {
	if (renderInfo.animating) return
	let oldNth = renderInfo.middlewareIndex;
	renderInfo.middlewareIndex = nth;
	renderInfo.forward = renderInfo.middlewareIndex > oldNth;
	renderMiddleware();

	document.querySelector('#events').selectedOptions[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

document.querySelector('#events').addEventListener('change', e => {
	changeMiddleware(+e.currentTarget.value)
})

function renderMiddlewaresSelect() {

	const eventsSelector = document.querySelector('#events')
	const selected = eventsSelector.value;
	eventsSelector.innerHTML = '';
	if (!renderInfo.request) return;
	const ends = []
	eventsSelector.appendChild(renderInfo.request.events.reduce((frag, e, i) => {
		const endingAfterMe = ends.filter(end => end > e.start).length
		ends.push(e.end)
		const option = document.createElement('option')
		option.value = i;
		option.textContent = '-'.repeat(endingAfterMe) + generateEventLabel(e);
		frag.appendChild(option)
		if (selected == option.value) option.selected = true;
		return frag
	}, document.createDocumentFragment()));
	eventsSelector.size = eventsSelector.children.length

	document.querySelector('#event-small').textContent = `${renderInfo.middlewareIndex + 1}/${renderInfo.request.events.length}`
	const duration = renderInfo.request.events.at(-1).end - renderInfo.request.id;
	document.querySelector('#meter-wrapper').childNodes[2].nodeValue = (+duration.toFixed(0)).toLocaleString() + 'ms'
	document.querySelector('meter').value = 0;
	document.querySelector('meter').max = duration;

	document.querySelector('#progress-wrapper').childNodes[2].nodeValue = renderInfo.request.events.length
	document.querySelector('progress').max = renderInfo.request.events.length;
}

function attachRenderListeners(parent) {
	document.querySelectorAll('details').forEach(d => d.querySelector('button').addEventListener('click', () =>
		changeMiddleware(renderInfo.request.events.findIndex(e => e.start == d.dataset.eventId))
	))
}

function extractRanges(numbers) {
	if (!numbers.length) return '';

	let ranges = [];
	let start = numbers[0];

	function addCurrentRange(last) {
		const rangeLength = last - start;
		if (rangeLength < 2) {
			ranges.push(...Array.from({ length: rangeLength + 1 }, (_, i) => (i + start).toString()));
		} else {
			ranges.push(`${start}-${last}`);
		}
	}

	for (let i = 1; i < numbers.length; i++) {
		const current = numbers[i];
		const last = numbers[i - 1];

		if (current - last !== 1) {
			addCurrentRange(last);
			start = current;
		}
	}
	addCurrentRange(numbers[numbers.length - 1]);

	return ranges.join(',');
}

function renderRequestPath() {
	cy.edges('.request-edge').removeClass('request-edge')
	cy.nodes('.request-node').removeClass('request-node')

	const nodeIDs = [];
	const nodeIndexes = [];
	const edgeIDs = [];
	const edgeIndexes = [];
	for (const [i, event] of renderInfo.request.events.entries()) {
		const nextEvent = renderInfo.request.events[i + 1]
		if (!nextEvent) continue;
		for (const from of generateEventNodes(event, true).map(node => node.data('id'))) {
			nodeIDs.push(from);
			nodeIndexes.push(i + 1);
			for (const to of generateEventNodes(nextEvent, true).map(node => node.data('id'))) {
				if (from === to) continue;
				edgeIDs.push(`${from}-${to}`);
				edgeIndexes.push(i + 2);
				edgeIDs.push(`${to}-${from}`);
				edgeIndexes.push(i + 2);
				nodeIDs.push(to);
				nodeIndexes.push(i + 2);
			}
		}
	}
	cy.filter(e => edgeIDs.includes(e.data('id'))).addClass('request-edge').data('label', '').data('order', []);
	cy.filter(n => nodeIDs.includes(n.data('id'))).addClass('request-node').data('order', []).forEach(n => n.data('label', n.data('baseLabel') || n.data('label')));

	const indexing = {}
	if (eventNumbers) {
		for (const [i, edgeID] of [...edgeIDs].entries()) {
			const edge = cy.$(`[id="${edgeID}"]`)
			if (!edge.length) continue
			edge.data('order', [...(edge.data('order') || []), edgeIndexes[i]]);
			indexing[edgeID] = edge;
		}
		for (const [i, nodeID] of [...nodeIDs].entries()) {
			const node = cy.$(`[id="${nodeID}"]`)
			if (!node.length) continue

			node.data('order', [...(node.data('order') || []), nodeIndexes[i]]);
			indexing[nodeID] = node;
		}
		for (const entity of Object.values(indexing)) {
			const oldLabel = entity.data('label');
			const nums = extractRanges(entity.data('order').filter((o, i, arr) => arr.indexOf(o) === i))
			if (oldLabel) entity.data('label', oldLabel + '\n' + nums)
			else entity.data('label', nums)
		}
	}


	cy.edges('.hidden').removeClass('hidden');
	if (!allNodes || !allEdges) {
		cy.edges('*').not('.request-edge').addClass('hidden')
		cy.edges('.request-edge').removeClass('request-edge');
	}
	cy.nodes('.hidden').removeClass('hidden');
	if (!allNodes) {
		for (const id of nodeIDs) {
			cy.$(`[id="${id}"]`).ancestors().addClass('request-node')
		}
		cy.nodes('*').not('.request-node').addClass('hidden')
		cy.nodes('.request-node').removeClass('request-node');
	}
	if (!eventHighlights){
		cy.nodes('.request-node').removeClass('request-node');
		cy.edges('.request-edge').removeClass('request-edge');
	}
}
function renderRequest() {
	renderInfo.middlewareIndex = 0;
	renderWindow(1, { body: '' })
	renderWindow(2, { body: '' })
	renderWindow(5, { body: '' })
	renderWindow(6, { body: '' })
	renderMiddleware();
	renderBubbles()
	renderMiddlewaresSelect()
	if (!renderInfo.request) return

	const w6 = document.querySelector('#window6 pre')
	w6.innerHTML = '';
	let lastHTML = ''
	for (const e of renderInfo.request.events) {
		let nextHTML = generateEventCodeHTML(e);
		if (nextHTML === lastHTML || lastHTML.includes(nextHTML)) nextHTML = 'SAME'
		if (nextHTML !== 'SAME') lastHTML = nextHTML
		w6.innerHTML += `<details open data-event-id="${e.start}"><summary>${generateEventLabel(e)} <button>Render</button></summary>${nextHTML === 'SAME' ? 'Same as previous' : nextHTML}</details>`
	}
	attachRenderListeners(w6)
	renderRequestPath()
}
requestSelect.addEventListener('change', (e) => {
	renderInfo.request = requests[e.currentTarget.value]
	renderRequest()
})

function enableButtons() {
	renderInfo.animating = false;
	document.querySelectorAll('input, textarea, button, select').forEach(b => b.disabled = false)
}
function disableButtons() {
	renderInfo.animating = true;
	document.querySelectorAll('input, textarea, button, select').forEach(b => b.disabled = true)
}

renderRequest()

document.querySelector('#reset-all').addEventListener('click', () => {
	if (!confirm('Clearing all local settings, are you sure?')) return
	localStorage.clear()
	alert('All local settings cleared')
	window.location.reload()
});

window.addEventListener('keydown', ({ target, key }) => {
	if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return
	switch (key) {
		case 'ArrowLeft':
		case 'ArrowRight':
			changeMiddleware(Math.min(Math.max(renderInfo.middlewareIndex + (key === 'ArrowLeft' ? -1 : 1), 0), renderInfo.request.events.length - 1));
			break
	}
});

function updateRequestInfo(request, updates){
	fetch('../update-request/' + request.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
}

function downloadBlob(blob, filename){
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.style.display = 'none';
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild(anchor);
	anchor.click();
	URL.revokeObjectURL(url);
	anchor.remove();
}

document.querySelector('#save-as-png').addEventListener('click', () => {
	window.open(cy.png({
		bg: document.querySelector('#transparentBackground').checked
			? 'transparent'
			: document.querySelector('#darkTheme').checked
				? '#41403e'
				: 'white',
		full: true
	}), '_blank')
});

document.querySelector('#save-as-svg').addEventListener('click', () => {
	const svgWindow = window.open("", 'SVG', '_blank')
	svgWindow.document.body.innerHTML = cy.svg({
		bg: document.querySelector('#transparentBackground').checked
			? 'transparent'
			: document.querySelector('#darkTheme').checked
				? '#41403e'
				: 'white',
		full: true
	})
});

(() => {
	const checkbox = document.querySelector('#modal-1');
	const modal = checkbox.nextElementSibling;
	modal.addEventListener('submit', e => {
		e.preventDefault();
		const name = modal.querySelector('#export-data-input').value
		localStorage.setItem(`saved-data-${name}`, JSON.stringify(serialize(getData(), { json: true })))
		checkbox.checked = false;
	})

	document.querySelector('#copy-data').addEventListener('click', () => {
		navigator.clipboard.writeText(JSON.stringify(serialize(getData(), { json: true }))).then(() => alert('Data copied to clipboard!'));
	});


	document.querySelector('#download-data').addEventListener('click', () => {
		downloadBlob(new Blob([JSON.stringify(serialize(getData(), { json: true }))], { type: 'application/json' }), 'data.json');
	});

	document.querySelector('#all-button').addEventListener('click', () => {
		const checkboxes = [...modal.querySelectorAll('ul input[type="checkbox"]')]
		const newValue = !checkboxes.every(c => c.checked)
		for (const checkbox of checkboxes) {
			checkbox.checked = newValue;
		}
	});

	document.querySelector('#invert-button').addEventListener('click', () => {
		for (const checkbox of modal.querySelectorAll('ul input[type="checkbox"]')) {
			checkbox.checked = !checkbox.checked;
		}
	});

	function getData() {
		const data = {
			version: VERSION,
		}
		if (modal.querySelector('#layout-windows-checkbox').checked) data.windows = Array.from({ length: 6 }, (_, i) => localStorage.getItem('window' + (i + 1) + '-style'))
		if (modal.querySelector('#layout-graph-checkbox').checked) data.graph = {
			modules,
			positions: cy.nodes().reduce((locs, n) => ({ ...locs, [n.id()]: n.position() }), {}),
			zoom: cy.zoom(),
			pan: cy.pan()
		}
		if (modal.querySelector('#layout-style-rules').checked) data.styleRules = JSON.parse(localStorage.getItem('style-rules') || '{}');
		const selectedRequests = Object.fromEntries([...modal.querySelectorAll('ul input[type="checkbox"]:checked')].map(checkbox => {
			const id = checkbox.id.split('-')[0];
			return [id, requests[id]];
		}))
		if (Object.keys(selectedRequests).length) data.requests = selectedRequests;
		return data
	}

	function renderRequestsUL(){
		modal.querySelector('ul').innerHTML = '';
		modal.querySelector('ul').appendChild(Object.entries(requests).reduce((frag, [id, request]) => {
			const li = document.createElement('li');
			li.innerHTML = `
				<label for="${id}-request" class="paper-check" style="display: flex;">
					<input type="checkbox" name="paperChecks" id="${id}-request" value="option 2">
					<span style="flex: 1;">${generateRequestLabel(request)}</span>
					<button style="float: right;" type="button">Rename</button>
					<button style="float: right;" type="button">Delete</button>
				</label>
			`;
			const [renameButton, deleteButton] = li.querySelectorAll('button')
			renameButton.addEventListener('click', () => {
				const { request } = renderInfo;
				const newLabel = prompt('New Request Name', generateRequestLabel(request))
				if (!newLabel) return;
				if (newLabel === generateRequestLabel(request)){
					if (request.label) delete request.label
					else return
				}
				request.label = newLabel;
				updateRequestInfo(request, { label: newLabel })
				renderRequestsSelect();
				renderRequestsUL()
			})
			deleteButton.addEventListener('click', () => {
				deleteRequest(id)
				li.remove()
			})

			frag.appendChild(li);
			return frag;
		}, document.createDocumentFragment()));
	}

	document.querySelector('#export-data-button').addEventListener('click', () => {
		checkbox.checked = true;

		modal.reset()

		const datalist = document.querySelector('#export-data-datalist')
		datalist.innerHTML = '';
		datalist.appendChild(Object.keys(localStorage).reduce((frag, key) => {
			if (!key.startsWith('saved-data-')) return frag;
			const name = key.split('saved-data-')[1];
			const option = document.createElement('option');
			option.textContent = name;
			frag.appendChild(option);
			return frag;
		}, document.createDocumentFragment()));

		renderRequestsUL()
	});
})();


(() => {
	const checkbox = document.querySelector('#modal-2');
	const modal = checkbox.nextElementSibling;
	modal.addEventListener('submit', async (e) => {
		e.preventDefault()

		let text;
		const inputs = ['import-data-file', 'import-data-text', 'import-data-select'].map(name => modal.querySelector('#' + name, e))
		if (inputs[0]) {
			text = await new Promise(resolve => {
				const reader = new FileReader();
				reader.onload = (e) => resolve(e.target.result);
				reader.readAsText(file)
			})
		}
		if (inputs[1]) text = inputs[1].value;
		if (inputs[2]) text = localStorage.getItem('saved-requests-' + localName);

		const { windows, graph, styleRules, requests: newRequests } = deserialize(JSON.parse(text))
		if (windows) {
			for (let i = 0; i < windows.length; i++) {
				localStorage.setItem('window' + (i + 1) + '-style', windows[i])
			}
			renderInitialWindows();
		}
		if (graph) {
			modules.splice(0, modules.length)
			modules.push(...graph.modules)
			cy.json({ elements: generateElements() })
			for (const [id, { x, y }] of Object.entries(graph.positions).sort((a, b) => a[0].split('/').length - b[0].split('/').length)) {
				cy.$(`[id="${id}"]`)?.position({ x, y })
				locations.update(id, { x, y })
			}
			cy.zoom(graph.zoom)
			cy.pan(graph.pan)
			localStorage.setItem('info', JSON.stringify({ zoom: graph.zoom, pan: graph.pan }));
		}
		if (styleRules) {
			localStorage.setItem('style-rules', JSON.stringify(styleRules))
			renderStyleRules()
			updateStyles()
		}
		if (newRequests){
			for (const key in requests) {
				delete requests[key];
			}
			Object.assign(requests, deserialize(JSON.parse(text)).requests)
			renderInfo.request = Object.values(requests)[0]
			renderInfo.middlewareIndex = 0;
			renderRequestsSelect();
			renderMiddlewaresSelect();
			renderRequest();
		}
	})

	const select = document.querySelector('#import-data-select')
	select.innerHTML = '';
	select.appendChild(Object.keys(localStorage).reduce((frag, key) => {
		if (!key.startsWith('saved-data-')) return frag;
		const name = key.split('saved-data-')[1];
		const option = document.createElement('option');
		option.textContent = name;
		frag.appendChild(option);
		return frag;
	}, document.createDocumentFragment()));

	document.querySelector('#import-data-button').addEventListener('click', () => {
		checkbox.checked = true;

		modal.reset()
	});
})();
