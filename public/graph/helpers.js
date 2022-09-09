import { renderInfo, root, views } from "./globals.js";

export function sourceLineToID(objects, fullSrc) {
	let src = fullSrc.split(':')[0]
	while (src.includes('/')) {
		if (objects.find(e => e.data.id === src)) break;
		src = src.split('/').slice(1).join('/')
	}
	return objects.find(e => e.data.id === src)
}

export function generateViewName(name) {
	const fullExt = views.extension.startsWith('.') ? views.extension : '.' + views.extension;
	return name + (name.endsWith(fullExt) ? '' : fullExt)
}

export function generateEventURLs(event) {
	return {
		added: event.handler?.add && `vscode://file${event.handler.add}`,
		evaluated: event.evaluate?.line && `vscode://file${event.evaluate.line}`,
		construct: event.handler?.construct && `vscode://file${event.handler.construct}`,
		source: event.handler?.location
			? `vscode://file${event.handler.location.path}:${event.handler.location.line}:${event.handler.location.column}`
			: event.source && `vscode://file${event.source}`,
		error: event.error?.line ? `vscode://file${event.error?.line}` : undefined,
	}
}

export function generateEventCodeHTML(event) {
	const urls = generateEventURLs(event)

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

	return allLines.map(({ key, html }) => `${key[0].toUpperCase() + key.slice(1)} <a href="${urls[key]}">${urls[key].replace('vscode://file' + root, '')}</a><br/><code>${html}</code>`).join('<br/>');
}

export function generateProxyCallLabel(event, content = '.'.repeat(event.args.count)) {
	const suffix = event.attachedToLatestRequest ? '*' : '';
	return event.property === 'constructor'
		? `new ${event.label}(${content})${suffix}`
		: `${event.label}.${event.property}(${content})${suffix}`;
}

export function generateEventLabel(event) {
	let label = 'Unknown';
	if (event.type === 'middleware') {
		if (event.handler.name === 'router') {
			const constructFilename = event.handler.construct?.replace(root, '').split(':').slice(0, -2)
			const routeAddedTo = (event.handler?.code?.add?.[1].match(/use\(('|"|`)(.*?)\1/i) || { 2: '' })[2]
			label = [routeAddedTo && `"${routeAddedTo}"` || '', constructFilename].join(' ');
		} else label = event.handler.name ? `${event.handler.name}()` : '<anonymous>'
	}
	else if (event.type === 'redirect') label = `Redirect to ${event.path}`
	else if (event.type === 'view') label = views.directory + `/` + generateViewName(event.name)
	else if (event.type === 'send') label = 'response.send()'
	else if (event.type === 'json') label = 'response.json()'
	else if (event.type === 'proxy-evaluate') label = generateProxyCallLabel(event);
	if (event.end && event.start) label += ' - ' + (event.end - event.start).toFixed(2) + 'ms';
	if (event.type === 'finish') label = `Finished in ${(event.end - renderInfo.request.id).toFixed(2)} ms`
	return label
}