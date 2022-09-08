import { LAYOUTS } from './constants.js'

import { generateStylesheet, renderStyleRules } from './style-rules.js'
import { sourceLineToID, generateViewName, generateEventURLs, generateEventCodeHTML, generateEventLabel, generateProxyCallLabel } from './helpers.js'
import { setupEventSource } from './sse.js';

import { animationDuration } from './animation-duration.js';

import './theme.js';

import { modules, root, views, requests, renderInfo } from './globals.js'

let compoundNodes = document.querySelector('#groups').checked
document.querySelector('#groups').addEventListener('change', e => {
	compoundNodes = e.currentTarget.checked;
	cy.json({ elements: generateElements() });
	renderBubbles();
})

let allEdges = document.querySelector('#allEdges').checked;
document.querySelector('#allEdges').addEventListener('change', e => {
	allEdges = e.currentTarget.checked;
	renderRequestPath();
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
		const parentNames = compoundNodes ? mod.source.split('/').slice(0, -1).reverse() : []
		for (let i = 0; i < parentNames.length; i++){
			const current = parentNames[i];
			const next = parentNames[i + 1];
			if (!(current in parentNames)) parents[current] = { data: { id: current, label: current, parent: next }, classes: 'group parent-' + current }
		}
		return {
			data: { id: mod.source, parent: parentNames[0], label: mod.source.split('/').at(-1), href: `vscode://file${root}${mod.source}` },
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
				const caller = event.evaluate.lines.length && sourceLineToID(elements, event.evaluate.lines[0])
				const id = views.directory + '/' + generateViewName(event.name)
				foundViews[event.name] = {
					data: { id, label: generateViewName(event.name), parent: compoundNodes && views.directory },
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
	elements.push(...Object.values(parents))
	return elements;
}



window.cy = cytoscape({
	container: document.getElementById('cy-div'),
	elements: generateElements(),
	layout: Object.values(LAYOUTS)[0],
	wheelSensitivity: 0.05
});
window.cy.style(generateStylesheet())
cy.on('tap', 'node', function () {
	const url = this.data('href')
	if (url) window.location.href = url
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
	// TODO - color things based on new style rules here
	//Object.entries(DIRECTORY_COLORS).forEach(([key, color]) => bb.addPath(cy.nodes(`.parent-${key}`), null, null, { ...options, style: { fill: color, fillOpacity: .25 } }))

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
		//		if (body.type === 'textContent' && !window.querySelector('pre')){
		//			window.querySelector('iframe').remove();
		//			window.querySelector('.mainWindow').appendChild(document.createElement('pre'));
		//		}
		//		else if (body.type === 'innerHTML' && !window.querySelector('iframe')){
		//			window.querySelector('pre').remove();
		//			window.querySelector('.mainWindow').appendChild(document.createElement('iframe'));
		//		}
		//if (body.type === 'textContent') window.querySelector('pre').textContent = body.string;
		const pre = window.querySelector('pre')
		if (body.type === 'code') pre.innerHTML = '<code>' + hljs.highlightAuto(body.string).value + '</code>';
		else pre.innerHTML = body.type === 'innerHTML' ? body.string : escapeHtml(body.string);
		//else window.querySelector('iframe').srcdoc = `<style>.red {color: red;background-color: rgb(85, 0, 0);} .green {color: rgb(0, 255, 0);background-color: rgb(0, 85, 0);}</style><body><pre>${body.string}</pre></body>`;
	}
	if (title !== undefined) window.querySelector('.windowTitle')[title.type] = title.string;
}

/**
 * @param {number} id
 * @param {Record<'content' | 'title', { type: 'textContent' | 'innerHTML' | 'code', string: 'string' } | string>} data
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

async function renderMiddleware() {
	if (!renderInfo.request) return
	document.querySelector('#events').value = renderInfo.middlewareIndex;

	document.querySelector('#event-small').textContent = `${renderInfo.middlewareIndex + 1}/${renderInfo.request.events.length}`
	const event = renderInfo.request.events[renderInfo.middlewareIndex]

	if (event.diffs) {
		renderWindow(1, { title: 'Request', body: event.diffs.request.replace(/<R2_A>([\s\S]*?)<\/R2_A>/g, (_, string) => `<span class="red">${string}</span>`).replace(/<R2_B>([\s\S]*?)<\/R2_B>/g, (_, string) => `<span class="green">${string}</span>`) });

		renderWindow(2, { title: 'Response', body: event.diffs.response.replace(/<R2_A>([\s\S]*?)<\/R2_A>/g, (_, string) => `<span class="red">${string}</span>`).replace(/<R2_B>([\s\S]*?)<\/R2_B>/g, (_, string) => `<span class="green">${string}</span>`) });
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

	const currentInAll = document.querySelector(`details[data-event-id="${event.start + '' + event.order}"]`)
	if (currentInAll) {
		currentInAll.open = true;
		currentInAll.scrollIntoView({ behavior: 'smooth', block: 'center' });
		document.querySelectorAll('details.highlighted-event').forEach(e => e.classList.remove('highlighted-event'));
		currentInAll.classList.add('highlighted-event');
	}

	if (!remaining.length) remaining.push(renderInfo.lastNode.data('id'))

	disableButtons()
	while (remaining.length) {
		const url = remaining.pop()
		const target = sourceLineToID(Object.values(cy.elements()).map(cye => {
			if (typeof cye?.data === 'function') return { data: cye.data() }
			else return { data: {} }
		}), url)

		let node = cy.filter(e => e.data('id') === target?.data.id)[0];
		if (node) renderInfo.lastNode = node;
		else node = renderInfo.lastNode;

		if (!node) return;

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
			hideOnClick: false,
			duration: [0, 0],
			zIndex: 50,

			// your own custom props
			// content prop can be used when the target is a single element https://atomiks.github.io/tippyjs/v6/constructor/#prop
			content: () => {
				let content = document.createElement('div');

				content.innerHTML = generateEventLabel(event);
				content.innerHTML += '<br/>' + Object.entries(urls).filter(([_, url]) => url && !url.includes('node_modules') && !url.includes('express-handler-tracker')).reduce((lines, [name, url]) => [...lines, `<a href="${url}">${name[0].toUpperCase() + name.slice(1)}</a>`], []).join('<br/>')

				return content;
			}
		})
		else {
			function percentileDiff(a, b, percent) {
				return (b - a) * percent + a
			}
			const from = renderInfo.tip.props.getReferenceClientRect()
			const to = ref.getBoundingClientRect()
			if (JSON.stringify(from) !== JSON.stringify(to)) {
				for (let i = 1; i <= 50; i++) {
					setTimeout(() => {
						renderInfo.tip.setProps({
							getReferenceClientRect: () => {
								const updated = {};
								for (const key in from) {
									updated[key] = percentileDiff(from[key], to[key], i / 50)
								}
								return updated;
							}
						})
					}, i * (animationDuration / 50))
				}
			}

			renderInfo.tip.setContent(() => {
				let content = document.createElement('div');

				content.innerHTML = generateEventLabel(event);
				content.innerHTML += '<br/>' + Object.entries(urls).filter(([_, url]) => url && !url.includes('node_modules') && !url.includes('express-handler-tracker')).reduce((lines, [name, url]) => [...lines, `<a href="${url}">${name[0].toUpperCase() + name.slice(1)}</a>`], []).join('<br/>')

				return content;
			})
			if (JSON.stringify(from) !== JSON.stringify(to)) await new Promise(r => setTimeout(r, animationDuration));
		}
		renderInfo.tip.show();
	}
	enableButtons()
}

const requestSelect = document.querySelector('#requests');

function generateRequestLabel(request) {
	return request.start.request.method + ' ' + request.start.request.url
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

document.querySelector('#delete-request').addEventListener('click', () => {
	if (!renderInfo.request) return;
	const { request } = renderInfo
	const index = Object.values(requests).findIndex(r => r.id === request.id)
	delete requests[request.id]
	renderInfo.request = Object.values(requests)[index] || Object.values(requests)[0];
	renderRequestsSelect()
	renderMiddlewaresSelect()
	renderRequest()
	renderMiddleware()
	fetch('../delete-request?id=' + request.id)
})


function changeMiddleware(nth) {
	let oldNth = renderInfo.middlewareIndex;
	renderInfo.middlewareIndex = nth;
	renderInfo.forward = renderInfo.middlewareIndex > oldNth;
	renderMiddleware();
}

document.querySelector('#events').addEventListener('change', e => {
	e.currentTarget.selectedOptions[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
}

function attachRenderListeners(parent) {
	document.querySelectorAll('details').forEach(d => d.querySelector('button').addEventListener('click', () =>
		changeMiddleware(renderInfo.request.events.findIndex(e => e.start + '' + e.order === d.dataset.eventId))
	))
}

function renderRequestPath() {
	cy.edges('.request-edge').removeClass('request-edge');

	for (const [i, event] of renderInfo.request.events.entries()) {
		const nextEvent = renderInfo.request.events[i + 1]
		if (!nextEvent) continue;
		const from = generateEventNodes(event, renderInfo.forward).map(node => node.data('id'));
		const to = generateEventNodes(nextEvent, renderInfo.forward).map(node => node.data('id'));
		for (const f of from) {
			const edgeIDs = new Set(to.map(id => `${f}-${id}`))
			cy.filter(e => edgeIDs.has(e.data('id'))).addClass('request-edge')
		}
	}

	if (allEdges) return cy.edges('.hidden').removeClass('hidden');
	cy.edges('*').not('.request-edge').addClass('hidden')
	cy.edges('.request-edge').removeClass('request-edge');
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
	for (const e of renderInfo.request.events) {
		w6.innerHTML += `<details open data-event-id="${e.start + '' + e.order}"><summary>${generateEventLabel(e)} <button>Render</button></summary>${generateEventCodeHTML(e)}</details>`
	}
	attachRenderListeners(w6)
	renderRequestPath()
}
requestSelect.addEventListener('change', (e) => {
	renderInfo.request = requests[e.currentTarget.value]
	renderRequest()
})

function enableButtons() {
	document.querySelectorAll('#events, #prev-middleware, #next-middleware').forEach(b => b.disabled = false)
}
function disableButtons() {
	document.querySelectorAll('#events, #prev-middleware, #next-middleware').forEach(b => b.disabled = true)
}

renderRequest()

/*
document.getElementById("save").addEventListener("click", function () {
	window.localStorage.setItem("cy-elements", JSON.stringify(cy.json()));
	alert('Graph Layout save to Local Storage')
});
*/

/*
document.getElementById("restore").addEventListener("click", function () {
	cy.elements().remove();
	cy.json({ elements: JSON.parse(window.localStorage.getItem("cy-elements")).elements }).layout({ name: 'preset' }).run();
	renderRequestsSelect()
	renderMiddleware()
	renderBubbles();
});
*/


document.querySelector('#reset-all').addEventListener('click', () => {
	if (!confirm('Clearing all local settings, are you sure?')) return
	localStorage.clear()
	alert('All local settings cleared')
	window.location.reload()
});
/*
document.querySelector('#export').addEventListener('click', () => {
	const data = Flatted.stringify({
		requests,
		modules,
		root,
		viewsDirectory,
		windows: [
			document.querySelector('#window1').getAttribute('style'),
			document.querySelector('#window2').getAttribute('style'),
			document.querySelector('#window3').getAttribute('style'),
			document.querySelector('#window4').getAttribute('style'),
			document.querySelector('#window5').getAttribute('style'),
			document.querySelector('#window6').getAttribute('style'),
		],
		cyElements: cy.json()
	})
	navigator.clipboard.writeText(data).then(() => alert('All data saved to clipboard!'));
});

document.querySelector('#import').addEventListener('click', () => {
	(navigator.clipboard.readText?.() || (async () => {
		const checkbox = document.querySelector('#modal-1');
		checkbox.checked = true;
		return new Promise(async (resolve, reject) => {
			while (checkbox.checked) await new Promise(r => setTimeout(r, 1000));
			const text = document.querySelector('#import-requests-text').value
			if (text) return resolve(text)
			const file = document.querySelector('#import-requests-file').files[0]
			if (!file) return reject(new Error('No data given'));
			const reader = new FileReader();
			reader.onload = (e) => resolve(e.target.result);
			reader.readAsText(file);
		});
	})()).then(text => {
		const data = Flatted.parse(text);
		({ requests, modules, root, viewsDirectory } = data);
		cy.elements().remove();
		cy.json({ elements: data.cyElements.elements }).layout({ name: 'preset' }).run();
		renderRequestsSelect()
		renderMiddleware()
		renderBubbles();
		document.querySelector('#window1').setAttribute('style', data.windows[0]);
		document.querySelector('#window2').setAttribute('style', data.windows[1]);
		document.querySelector('#window3').setAttribute('style', data.windows[2]);
		document.querySelector('#window4').setAttribute('style', data.windows[3]);
		document.querySelector('#window5').setAttribute('style', data.windows[3]);
		document.querySelector('#window6').setAttribute('style', data.windows[3]);
	});
});
*/

(() => {
	const checkbox = document.querySelector('#modal-1');
	const modal = checkbox.nextElementSibling;

	document.querySelector('#all-button').addEventListener('click', () => {
		const checkboxes = [...modal.querySelectorAll('input[type="checkbox"]')]
		const newValue = !checkboxes.every(c => c.checked)
		for (const checkbox of checkboxes) {
			checkbox.checked = newValue;
		}
	});

	document.querySelector('#invert-button').addEventListener('click', () => {
		for (const checkbox of modal.querySelectorAll('input[type="checkbox"]')) {
			checkbox.checked = !checkbox.checked;
		}
	});

	function getSelectedRequests() {
		return Object.fromEntries([...modal.querySelectorAll('input[type="checkbox"]:checked')].map(checkbox => {
			const id = checkbox.id.split('-')[0];
			return [id, requests[id]];
		}))
	}

	document.querySelector('#copy-requests').addEventListener('click', () => {
		navigator.clipboard.writeText(Flatted.stringify(getSelectedRequests())).then(() => alert('Requests copied to clipboard!'));
	});


	document.querySelector('#download-requests').addEventListener('click', () => {
		const blob = new Blob([Flatted.stringify(getSelectedRequests())], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.style.display = 'none';
		anchor.href = url;
		anchor.download = 'requests.json';
		document.body.appendChild(anchor);
		anchor.click();
		URL.revokeObjectURL(url);
		anchor.remove();
	});

	document.querySelector('#export-requests').addEventListener('click', () => {
		checkbox.checked = true;

		modal.querySelector('ul').appendChild(Object.entries(requests).reduce((frag, [id, request]) => {
			const li = document.createElement('li');
			li.innerHTML = `
				<label for="${id}-request" class="paper-check">
					<input type="checkbox" name="paperChecks" id="${id}-request" value="option 2"> <span>${generateRequestLabel(request)}</span>
				</label>
			`;

			frag.appendChild(li);
			return frag;
		}, document.createDocumentFragment()));
	});
})();


(() => {
	const checkbox = document.querySelector('#modal-2');
	const modal = checkbox.nextElementSibling;


	document.querySelector('#import-requests').addEventListener('click', () => {
		checkbox.checked = true;
		return new Promise(async (resolve, reject) => {
			while (checkbox.checked) await new Promise(r => setTimeout(r, 1000));
			const text = document.querySelector('#import-requests-text').value
			if (text) return resolve(text)
			const file = document.querySelector('#import-requests-file').files[0]
			if (!file) return reject(new Error('No data given'));
			const reader = new FileReader();
			reader.onload = (e) => resolve(e.target.result);
			reader.readAsText(file);
		}).then(text => {
			for (const key in requests){
				delete requests[key];
			}
			Object.assign(requests, Flatted.parse(text))
			renderInfo.request = Object.values(requests)[0]
			renderInfo.middlewareIndex = 0;
			renderRequestsSelect();
			renderMiddlewaresSelect();
			renderRequest();
		});
	});
})();


(() => {
	const checkbox = document.querySelector('#modal-3');
	const modal = checkbox.nextElementSibling;

	function getSelectedData(){
		const data = {}
		if (modal.querySelector('#layout-windows-checkbox').checked) data.windows = Array.from({ length: 6 }, (_, i) => localStorage.getItem('window' + (i + 1) + '-style'))
		if (modal.querySelector('#layout-nodes-checkbox').checked) data.nodes = cy.nodes().map(n => ({ id: n.id(), position: n.position()}))
		if (modal.querySelector('#layout-style-rules').checked) data.styleRules = JSON.parse(localStorage.getItem('style-rules') || '{}');
		return data
	}

	document.querySelector('#copy-layout').addEventListener('click', () => {
		navigator.clipboard.writeText(Flatted.stringify(getSelectedData())).then(() => alert('Layout copied to clipboard!'));
	});


	document.querySelector('#download-layout').addEventListener('click', () => {
		const blob = new Blob([Flatted.stringify(getSelectedData())], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.style.display = 'none';
		anchor.href = url;
		anchor.download = 'layout.json';
		document.body.appendChild(anchor);
		anchor.click();
		URL.revokeObjectURL(url);
		anchor.remove();
	});

	document.querySelector('#export-layout').addEventListener('click', () => {
		checkbox.checked = true;
	});
})();


(() => {
	const checkbox = document.querySelector('#modal-4');
	const modal = checkbox.nextElementSibling;


	document.querySelector('#import-layout').addEventListener('click', () => {
		checkbox.checked = true;
		return new Promise(async (resolve, reject) => {
			while (checkbox.checked) await new Promise(r => setTimeout(r, 1000));
			const text = document.querySelector('#import-layout-text').value
			if (text) return resolve(text)
			const file = document.querySelector('#import-layout-file').files[0]
			if (!file) return reject(new Error('No data given'));
			const reader = new FileReader();
			reader.onload = (e) => resolve(e.target.result);
			reader.readAsText(file);
		}).then(text => {
			const { windows, nodes, styleRules } = Flatted.parse(text)
			if (windows) {
				for (let i = 0; i < windows.length; i++){
					localStorage.setItem('window' + (i + 1) + '-style', windows[i])
				}
				renderInitialWindows();
			}
			if (nodes) {
				for (const { id, position: { x, y } } of nodes){
					const node = cy.$('#' + id)
					if (!node) continue;
					node.position({ x, y });
				}
			}
			if (styleRules) {
				localStorage.setItem('style-rules', JSON.stringify(styleRules))
				renderStyleRules()
				updateStyles()
			}
		});
	});
})();

