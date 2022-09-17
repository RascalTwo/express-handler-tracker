import { renderInfo, requests, viewInfo } from "./globals.js";

export function sourceLineToID(objects, fullSrc) {
	let src = fullSrc.split(':')[0]
	while (src.includes('/')) {
		if (objects.find(e => e.data.id === src)) break;
		src = src.split('/').slice(1).join('/')
	}
	return objects.find(e => e.data.id === src)
}

export function generateViewName(name) {
	const fullExt = viewInfo.views.extension.startsWith('.') ? viewInfo.views.extension : '.' + viewInfo.views.extension;
	return name + (name.endsWith(fullExt) ? '' : fullExt)
}

const formatLocationSuffix = (root, line, column) => {
	if (line === undefined) return '';
	if (root.includes('github.com')) return '#L' + line;
	return ':' + line + ':' + column;
}

export const generateURL = (root, path, lineNumber) => {
	const filepath = path.includes(':') ? path.split(':').slice(0, -2).join(':') : path;
	const [line, column] = path.includes(':') ? path.split(':').slice(-2) : [undefined, undefined];
	const url = viewInfo.filepathPrefix + filepath + (lineNumber ? formatLocationSuffix(root, line, column) : '');
	return url
}

export function generateEventURLs(event, lineNumber = true) {
	return {
		added: event.handler?.add && generateURL(viewInfo.root, event.handler.add, lineNumber),
		evaluated: event.evaluate?.line && generateURL(viewInfo.root, event.evaluate.line, lineNumber),
		construct: event.handler?.construct && generateURL(viewInfo.root, event.handler.construct, lineNumber),
		source: event.handler?.location
			? generateURL(viewInfo.root, `${event.handler.location.path}:${event.handler.location.line}:${event.handler.location.column}`, lineNumber)
			: event.source && generateURL(viewInfo.root, event.source, lineNumber),
		error: event.error?.line ? generateURL(viewInfo.root, event.error.line, lineNumber) : undefined,
	}
}

export function generateHighlightedCode(event, urls = generateEventURLs(event)) {
	const codes = Object.fromEntries(Object.entries({
		added: event.handler?.code?.add,
		evaluated: event.evaluate?.code,
		construct: event.handler?.code?.construct,
		source: event.handler?.code?.location || event.code,
		error: event.error?.code,
	}).filter(([_, code]) => code))

	let allLines = [];
	for (const [key, code] of Object.entries(codes)) {
		allLines.push({
			key,
			html: hljs.lineNumbersValue(hljs.highlightAuto(code.map(l => l.trim() ? l : '​').join('\n')).value, { startFrom: +urls[key].split(':').at(-2) - 1 })
		});
	}

	return allLines
}

export function generateEventCodeHTML(event, urls = generateEventURLs(event)) {
	return generateHighlightedCode(event, urls).map(({ key, html }) => `${key[0].toUpperCase() + key.slice(1)} <a ${urls[key].includes('http') ? 'target="_blank"' : ''} href="${urls[key]}">${urls[key].replace(viewInfo.filepathPrefix, '')}</a><br/><code>${html}</code>`).join('<br/>');
}

export function generateProxyCallLabel(event, content = '.'.repeat(event.args.count)) {
	const suffix = event.attachedToLatestRequest ? '*' : '';
	return event.property === 'constructor'
		? `new ${event.label}(${content})${suffix}`
		: event.args.count === undefined
			? `${event.label}.${event.property}${suffix}`
			: `${event.label}.${event.property}(${content})${suffix}`;
}

export function generateEventLabel(event, ms = true) {
	let label = 'Unknown';
	if (event.type === 'middleware') {
		if (event.handler.name === 'router') {
			const constructFilename = event.handler.construct?.replace(viewInfo.filepathPrefix, '').split(':').slice(0, -2)
			const routeAddedTo = (event.handler?.code?.add?.[1].match(/use\(('|"|`)(.*?)\1/i) || { 2: '' })[2]
			label = [routeAddedTo && `"${routeAddedTo}"` || '', constructFilename].join(' ');
		} else label = event.handler.name ? `${event.handler.name}()` : '<anonymous>'
	}
	else if (event.type === 'redirect') label = `Redirect to ${event.path}`
	else if (event.type === 'view') label = viewInfo.views.directory + `/` + generateViewName(event.name)
	else if (event.type === 'send') label = 'response.send()'
	else if (event.type === 'json') label = 'response.json()'
	else if (event.type === 'proxy-evaluate') label = generateProxyCallLabel(event);
	if (ms && event.end && event.start) label += ' - ' + (event.end - event.start).toFixed(2) + 'ms';

	if (event.type === 'start') label = `Started\n`
	if (event.type === 'finish') label = 'Finished' + (ms ? ` in ${(event.end - renderInfo.request.id).toFixed(2)} ms` : '')

	return label
}

export function generateElements() {
	const compoundNodes = document.querySelector('#groups').checked;


	const parents = {};
	const elements = viewInfo.modules.map(mod => {
		const parentNames = mod.source.split('/').slice(0, -1).reverse()
		for (let i = 0; i < parentNames.length; i++) {
			const current = parentNames[i];
			const next = parentNames[i + 1];
			if (!(current in parentNames)) parents[current] = { data: { id: current, label: current, parent: next }, classes: 'group parent-' + current }
		}
		const label = mod.source.split('/').at(-1)
		return {
			data: { id: mod.source, parent: compoundNodes ? parentNames[0] : undefined, label, baseLabel: label, href: generateURL(viewInfo.root, mod.source) },
			classes: parentNames[0] ? 'parent-' + parentNames[0] : undefined
		}
	})
	for (const mod of viewInfo.modules) {
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
				const id = viewInfo.views.directory + '/' + label
				foundViews[event.name] = {
					data: { id, label, baseLabel: label, parent: compoundNodes && viewInfo.views.directory },
					classes: 'parent-' + viewInfo.views.directory
				}
				if (caller) {
					elements.push({ data: { id: `${caller.data.id}-${id}`, source: caller.data.id, target: id, arrow: 'triangle' }, classes: 'group' })
				}
			}
		}
	}
	if (Object.values(foundViews).length) {
		elements.push(...Object.values(foundViews))
		if (compoundNodes) elements.push({ data: { id: viewInfo.views.directory, label: viewInfo.views.directory }, classes: `parent-${viewInfo.views.directory} group` })
	}
	if (compoundNodes) elements.push(...Object.values(parents))
	return elements;
}

export function importData({ windows, graph, styleRules, layoutValues, requests: newRequests, paths, VERSION, external }, cy) {
	if (windows) {
		for (let i = 0; i < windows.length; i++) {
			localStorage.setItem('window' + (i + 1) + '-style', windows[i])
		}
	}
	if (newRequests) {
		localStorage.setItem('importing-requests', JSON.stringify(serialize(newRequests)))
		for (const key in requests) {
			delete requests[key];
		}
		Object.assign(requests, newRequests)
		renderInfo.request = Object.values(requests)[0]
		renderInfo.middlewareIndex = 0;
	}
	if (graph) {
		viewInfo.modules.splice(0, viewInfo.modules.length)
		viewInfo.modules.push(...graph.modules)
		if (cy) {
			cy.json({ elements: generateElements() })
			for (const [id, { x, y }] of Object.entries(graph.positions).sort((a, b) => a[0].split('/').length - b[0].split('/').length)) {
				cy.$(`[id="${id}"]`)?.position({ x, y })
				locations.update(id, { x, y })
			}
			cy.zoom(graph.zoom)
			cy.pan(graph.pan)
		}
		localStorage.setItem('info', JSON.stringify({ zoom: graph.zoom, pan: graph.pan }));
	}
	if (styleRules) {
		localStorage.setItem('style-rules', JSON.stringify(styleRules))
	}
	if (layoutValues) {
		document.querySelector('#layout-options').value = layoutValues['layout-options'];
		document.querySelector('#animation-duration').value = layoutValues['animation-duration'];
		document.querySelector('#allEdges').checked = layoutValues.allEdges;
		document.querySelector('#eventNumbers').checked = layoutValues.eventNumbers;
		document.querySelector('#allNodes').checked = layoutValues.allNodes;
		document.querySelector('#darkTheme').checked = layoutValues.darkTheme;
		document.querySelector('#eventHighlights').checked = layoutValues.eventHighlights;
		document.querySelector('#codeTooltips').checked = layoutValues.codeTooltips;
	}
	localStorage.setItem('importing-info', JSON.stringify({
		...paths,
		VERSION,
		modules: graph?.modules || [],
		external
	}))
	viewInfo.root = paths.root;
	viewInfo.views = paths.views;
	if (graph?.modules) viewInfo.modules = graph.modules;
}

export const locations = (() => {
	const locs = JSON.parse(localStorage.getItem('locations') || '{}');
	return {
		update(id, newLoc) {
			locs[id] = newLoc
			localStorage.setItem('locations', JSON.stringify(locs))
		}
	}
})();