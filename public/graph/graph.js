import LAYOUTS from './layouts.js'

let animationDuration = 1000;
(() => {
	const range = document.querySelector('#animation-duration')
	range.addEventListener('change', () => {
		animationDuration = +range.value
	})
	animationDuration = range.value;
})();



const DIRECTORY_COLORS = {
	models: 'red',
	model: 'red',
	views: 'blue',
	view: 'blue',
	controllers: 'green',
	controller: 'green',
	routers: 'yellow',
	router: 'yellow',
	routes: 'yellow',
	route: 'yellow',
}

let compoundNodes = true;


let requests = await fetch('../requests').then(r => r.text()).then(raw => Flatted.parse(raw));
let { modules, root, viewsDirectory } = await fetch('../info').then(r => r.json());

let fails = 1;
const connectionIndicator = document.querySelector('#connection-indicator');
function setupEventSource() {
	const es = new EventSource('../events');
	connectionIndicator.dataset.readyState = es.readyState
	es.addEventListener('open', () => {
		connectionIndicator.dataset.readyState = es.readyState
		fails = 0;
	})
	es.addEventListener('message', event => {
		fails = 0;
		const newRequests = Flatted.parse(event.data);
		for (const [id, request] of Object.entries(newRequests)) {
			if (!(id in requests)) {
				requests[id] = request;
				continue;
			}
			for (const event of request.events) {
				requests[id].events.push(event)
			}

			requests[id].events.sort((a, b) => a.start - b.start);
		}
		if (!currentRequest) currentRequest = Object.values(requests)[0]
		renderRequestsSelect();
		renderMiddlewaresSelect();
	});

	es.addEventListener('error', err => {
		fails++;
		connectionIndicator.dataset.readyState = es.readyState;
		console.error(err);
		if (es.readyState === 2) {
			es.close()
			setTimeout(() => setupEventSource(), 5000 * fails);
		}
	});
}
setupEventSource();

function sourceLineToID(objects, fullSrc) {
	let src = fullSrc.split(':')[0]
	while (src.includes('/')) {
		if (objects.find(e => e.data.id === src)) break;
		src = src.split('/').slice(1).join('/')
	}
	return objects.find(e => e.data.id === src)
}

function generateElements() {
	const parents = {};
	const elements = modules.map(mod => {
		const parent = compoundNodes && mod.source.split('/').at(-2)
		if (parent && !(parent in parents)) parents[parent] = { data: { id: parent, label: parent }, classes: 'group parent-' + parent }
		return {
			data: { id: mod.source, parent, label: mod.source.split('/').at(-1), href: `vscode://file${root}${mod.source}` },
			classes: parent ? 'parent-' + parent : undefined
		}
	})
	for (const mod of modules) {
		for (const dep of mod.dependencies) {
			elements.push({
				data: {
					id: `${mod.source}-${dep}`,
					source: mod.source,
					target: dep,
					arrow: 'triangle'
				}
			})
		}
	}
	const views = {}
	for (const req of Object.values(requests)) {
		for (const event of req.events) {
			if (event.type === 'view') {
				const caller = sourceLineToID(elements, event.evaluate_lines[0])
				const id = viewsDirectory + '/' + event.name
				views[event.name] = {
					data: { id, label: event.name, parent: compoundNodes && viewsDirectory },
					classes: 'parent-' + viewsDirectory
				}
				if (caller) {
					elements.push({ data: { id: `${caller.data.id}-${id}`, source: caller.data.id, target: id, arrow: 'triangle' }, classes: 'group' })
				}
			}
		}
	}
	if (Object.values(views)) {
		elements.push(...Object.values(views))
		if (compoundNodes) elements.push({ data: { id: viewsDirectory, label: viewsDirectory }, classes: `parent-${viewsDirectory} group` })
	}
	elements.push(...Object.values(parents))
	return elements;
}



const cy = cytoscape({
	container: document.getElementById('cy'),
	elements: generateElements(),
	layout: Object.values(LAYOUTS)[0],
	wheelSensitivity: 0.05,
	style: [
		{
			selector: 'node',
			style: {
				shape: 'hexagon',
				label: 'data(label)',
				'border-style': 'solid',
				'border-width': '1px',
				'border-color': 'black'
			}
		}, {
			"selector": ".group",
			"style": {
				"color": "#fff",
				"text-outline-color": "#888",
				"text-outline-width": 2
			}
		}, {
			selector: "edge",
			css: {
				"line-fill": "linear-gradient",
				"line-gradient-stop-colors": e => {
					const source = e.data('source')
					const target = e.data('target')

					const sourceParent = source.split('/').at(-2)
					const targetParent = target.split('/').at(-2)
					let sc = DIRECTORY_COLORS[sourceParent] || 'grey';
					let tc = DIRECTORY_COLORS[targetParent] || 'grey';
					if (sc === 'grey') sc = tc;
					if (tc === 'grey') tc = sc;
					return sc + ' ' + tc
				},
				"line-gradient-stop-positions": "49 51",
				'target-arrow-shape': 'triangle',
				'target-arrow-color': e => {
					const target = e.data('target')

					const targetParent = target.split('/').at(-2)
					let tc = DIRECTORY_COLORS[targetParent] || 'grey';
					return tc
				},
				"curve-style": "straight",
				// TODO - make customizable
			}
		}, ...Object.entries(DIRECTORY_COLORS).flatMap(([name, color]) => [{
			"selector": `.parent-${name}`,
			"style": {
				"background-color": color,
			}
		}, {
			"selector": `.group.parent-${name}`,
			"style": {
				'background-opacity': 0.25,
				"color": color,
			}
		}])]
});
document.querySelector('#groups').addEventListener('change', e => {
	compoundNodes = e.currentTarget.checked;
	cy.json({ elements: generateElements() });
	renderBubbles();
})
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
	Object.entries(DIRECTORY_COLORS).forEach(([key, color]) => bb.addPath(cy.nodes(`.parent-${key}`), null, null, { ...options, style: { fill: color, fillOpacity: .25 } }))

	if (!currentRequest) return;
	const ids = new Set();
	for (const event of currentRequest.events) {
		const urls = {
			added: event.handler && `vscode://file${event.handler.adds[0][0]}`,
			evaluated: event.evaluate_lines && `vscode://file${event.evaluate_lines[0]}`,
			construct: event.handler?.construct && `vscode://file${event.handler.construct[0]}`,
			source: event.handler?.location ? `vscode://file${event.handler.location.path}:${event.handler.location.line}:${event.handler.location.column}` : event.source_line && `vscode://file${event.source_line}`,
			error: event.error?.lines.length ? `vscode://file${event.error?.lines[0]}` : undefined
		}
		const remaining = [...'added evaluated construct source error'.split` `.map(key => urls[key]).filter(Boolean).map(u => u.split('//').at(-1)).reverse(), ...(event.type === 'view' ? [viewsDirectory + '/' + event.name] : [])];

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

let currentRequest = Object.values(requests)[0]
let nthMiddleware = 0;
let forward = true;
let tip;
let lastNode;
async function renderMiddleware() {
	if (!currentRequest) return
	document.querySelector('#events').value = nthMiddleware;

	document.querySelector('#event-small').textContent = `${nthMiddleware + 1}/${currentRequest.events.length}`
	const event = currentRequest.events[nthMiddleware]
	if (event.diffs) {
		renderWindow(1, { title: 'Request', body: event.diffs.request.replace(/<R2_A>([\s\S]*?)<\/R2_A>/g, (_, string) => `<span class="red">${string}</span>`).replace(/<R2_B>([\s\S]*?)<\/R2_B>/g, (_, string) => `<span class="green">${string}</span>`) });

		renderWindow(2, { title: 'Response', body: event.diffs.response.replace(/<R2_A>([\s\S]*?)<\/R2_A>/g, (_, string) => `<span class="red">${string}</span>`).replace(/<R2_B>([\s\S]*?)<\/R2_B>/g, (_, string) => `<span class="green">${string}</span>`) });
	} else if (event.type === 'redirect') {
		renderWindow(1, { body: '' })
		renderWindow(2, { title: 'Redirected', body: event.path })
	} else if (event.type === 'view') {
		renderWindow(1, { body: '' })
		console.log(event)
		renderWindow(2, { title: event.name + ' view', body: { type: 'code', string: event.locals ? JSON.stringify(event.locals, undefined, '  ') : '{}' } });
	} else if (event.type === 'send') {
		renderWindow(1, { body: '' })
		renderWindow(2, { title: 'Response Body', body: { type: 'code', string: event.body } });
	} else if (event.type === 'json') {
		renderWindow(1, { body: '' })
		renderWindow(2, { title: 'Response JSON', body: event.body });
	}

	const urls = {
		added: event.handler && `vscode://file${event.handler.adds[0][0]}`,
		evaluated: event.evaluate_lines && `vscode://file${event.evaluate_lines[0]}`,
		construct: event.handler?.construct && `vscode://file${event.handler.construct[0]}`,
		source: event.handler?.location ? `vscode://file${event.handler.location.path}:${event.handler.location.line}:${event.handler.location.column}` : event.source_line && `vscode://file${event.source_line}`,
		error: event.error?.lines.length ? `vscode://file${event.error?.lines[0]}` : undefined
	}
	const remaining = [...'added evaluated construct source error'.split` `.map(key => urls[key]).filter(Boolean).map(u => u.split('//').at(-1)).reverse(), ...(event.type === 'view' ? [viewsDirectory + '/' + event.name] : [])];
	if (!forward) remaining.reverse()

	disableButtons()
	while (remaining.length) {
		const url = remaining.pop()
		const target = sourceLineToID(Object.values(cy.elements()).map(cye => {
			if (typeof cye?.data === 'function') return { data: cye.data() }
			else return { data: {} }
		}), url)

		let node = cy.filter(e => e.data('id') === target?.data.id)[0];
		if (node) lastNode = node;
		else node = lastNode;

		if (!node) return;

		let ref = node.popperRef(); // used only for positioning
		// A dummy element must be passed as tippy only accepts dom element(s) as the target
		// https://atomiks.github.io/tippyjs/v6/constructor/#target-types
		let dummyDomEle = document.querySelector('#tooltippy');

		if (!tip) tip = new tippy(dummyDomEle, { // tippy props:
			getReferenceClientRect: ref.getBoundingClientRect, // https://atomiks.github.io/tippyjs/v6/all-props/#getreferenceclientrect
			trigger: 'manual', // mandatory, we cause the tippy to show programmatically.
			allowHTML: true,
			interactive: true,
			hideOnClick: false,
			duration: [0, 0],
			zIndex: 50,

			// your own custom props
			// content prop can be used when the target is a single element https://atomiks.github.io/tippyjs/v6/constructor/#prop
			content: () => {
				let content = document.createElement('div');

				content.innerHTML = eventToLabel(event);
				content.innerHTML += '<br/>' + Object.entries(urls).filter(([_, url]) => url && !url.includes('node_modules') && !url.includes('express-handler-tracker')).reduce((lines, [name, url]) => [...lines, `<a href="${url}">${name[0].toUpperCase() + name.slice(1)}</a>`], []).join('<br/>')

				return content;
			}
		})
		else {
			function percentileDiff(a, b, percent) {
				return (b - a) * percent + a
			}
			const from = tip.props.getReferenceClientRect()
			const to = ref.getBoundingClientRect()
			if (JSON.stringify(from) !== JSON.stringify(to)) {
				for (let i = 1; i <= 50; i++) {
					setTimeout(() => {
						tip.setProps({
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

			tip.setContent(() => {
				let content = document.createElement('div');

				content.innerHTML = eventToLabel(event);
				content.innerHTML += '<br/>' + Object.entries(urls).filter(([_, url]) => url && !url.includes('node_modules') && !url.includes('express-handler-tracker')).reduce((lines, [name, url]) => [...lines, `<a href="${url}">${name[0].toUpperCase() + name.slice(1)}</a>`], []).join('<br/>')

				return content;
			})
			if (JSON.stringify(from) !== JSON.stringify(to)) await new Promise(r => setTimeout(r, animationDuration));
		}
		tip.show();
	}
	enableButtons()
}

const requestSelect = document.querySelector('#requests');

function renderRequestsSelect() {
	const selected = requestSelect.value;
	requestSelect.innerHTML = '';
	requestSelect.appendChild(Object.entries(requests).reduce((frag, [value, request], i) => {
		const option = document.createElement('option');
		option.value = value;
		option.textContent = request.start.request.method + ' ' + request.start.request.url
		if (!i && !selected) option.selected = true;
		else if (selected == option.value) option.selected = true;

		frag.appendChild(option)
		return frag;
	}, document.createDocumentFragment()))
}
renderRequestsSelect()


function eventToLabel(event) {
	let label = 'Unknown';
	if (event.type === 'middleware') label = event.handler.name ? `${event.handler.name}()` : '<anonymous>'
	else if (event.type === 'redirect') label = `Redirect to ${event.path}`
	else if (event.type === 'view') label = viewsDirectory + `/` + event.name
	else if (event.type === 'send') label = 'response.send()'
	else if (event.type === 'json') label = 'response.json()'
	label += ' - ' + (event.end - event.start) + 'ms'
	return label
}

document.querySelector('#events').addEventListener('change', e => {
	nthMiddleware = +e.currentTarget.value;
	renderMiddleware();
})

function renderMiddlewaresSelect(){

	const eventsSelector = document.querySelector('#events')
	const selected = eventsSelector.value;
	eventsSelector.innerHTML = '';
	eventsSelector.appendChild(currentRequest.events.reduce((frag, e, i) => {
		const option = document.createElement('option')
		option.value = i;
		option.textContent = eventToLabel(e);
		frag.appendChild(option)
		if (selected == option.value) option.selected = true;
		return frag
	}, document.createDocumentFragment()));
	eventsSelector.size = eventsSelector.children.length
}

function renderRequest() {
	nthMiddleware = 0;
	renderMiddleware();
	renderBubbles()
	if (!currentRequest) return
	renderMiddlewaresSelect()
}
requestSelect.addEventListener('change', (e) => {
	currentRequest = requests[e.currentTarget.value]
	renderRequest()
})

function enableButtons() {
	document.querySelectorAll('#events, #prev-middleware, #next-middleware').forEach(b => b.disabled = false)
}
function disableButtons() {
	document.querySelectorAll('#events, #prev-middleware, #next-middleware').forEach(b => b.disabled = true)
}

renderRequest()

const observer = new MutationObserver(mutations => {
	for (const { target: w } of mutations) {
		localStorage.setItem(`${w.id}-style`, w.getAttribute('style'));
	}
})
document.querySelectorAll('.window').forEach(w => observer.observe(w, { attributeFilter: ['class'] }))

document.getElementById("save").addEventListener("click", function () {
	window.localStorage.setItem("cy-elements", JSON.stringify(cy.json()));
	alert('Graph Layout save to Local Storage')
});

document.querySelector('#window1').setAttribute('style', window.localStorage.getItem("window1-style") || '');
document.querySelector('#window2').setAttribute('style', window.localStorage.getItem("window2-style") || '');
document.querySelector('#window3').setAttribute('style', window.localStorage.getItem("window3-style") || '');
document.querySelector('#window4').setAttribute('style', window.localStorage.getItem("window4-style") || '');

document.getElementById("restore").addEventListener("click", function () {
	cy.elements().remove();
	cy.json({ elements: JSON.parse(window.localStorage.getItem("cy-elements")).elements }).layout({ name: 'preset' }).run();
	renderRequestsSelect()
	renderMiddleware()
	renderBubbles();
});


document.querySelector('#reset-windows').addEventListener('click', () => {
	for (const child of document.querySelector('.windowGroup').children) {
		child.removeAttribute('style');
		window.localStorage.removeItem(child.id);
	}
})

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
			const text = document.querySelector('#import-text').value
			if (text) return resolve(text)
			const file = document.querySelector('#import-file').files[0]
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
		// TODO - probably need to also update the middleware select & count too
		renderBubbles();
		document.querySelector('#window1').setAttribute('style', data.windows[0]);
		document.querySelector('#window2').setAttribute('style', data.windows[1]);
		document.querySelector('#window3').setAttribute('style', data.windows[2]);
		document.querySelector('#window4').setAttribute('style', data.windows[3]);
	});
});