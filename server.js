const path = require('path')
const fs = require('fs')

const express = require('express');
const cors = require('cors');
const { cruise } = require("dependency-cruiser");

const { SETTINGS, REQUESTS, VERSION } = require('./globals')

const { handleSSERequests } = require('./sse');
const serialize = require('./public/serialize');

let cruiseModules;

const server = express();
server.use(compression())
server.use(cors());
server.use(express.static(path.join(__dirname, 'public')));

server.get('/', function renderHomepage(request, response) {
	response.redirect(request.originalUrl + 'graph');
});
server.get('/graph', function renderGraphPage(_, response){
	response.sendFile(path.join(__dirname, 'public/graph/graph.html'))
});
server.get('/info', function sendDependencyInfo(_, response){
	const root = path.dirname(path.resolve(SETTINGS.entryPoint)) + '/'
	const viewsRelativeDirectory = path.relative(root, SETTINGS.views.directory)

	if (!cruiseModules) {
		const fullExt = SETTINGS.views.extension.startsWith('.') ? SETTINGS.views.extension : '.' + SETTINGS.views.extension;
		const addExtIfMissing = name => name + (name.endsWith(fullExt) ? '' : fullExt)
		const { output: { modules } } = cruise([SETTINGS.entryPoint], { exclude: ['node_modules', 'express-handler-tracker'] });
		cruiseModules = modules.filter(module => !module.coreModule).map(({ source, dependencies }) => ({ source, dependencies: dependencies.filter(dep => !dep.coreModule).map(({ resolved }) => resolved) }))
		for (const module of [...cruiseModules]){
			const viewNames = [...(fs.readFileSync(path.join(root, module.source)).toString().matchAll(/.*?\.render\(('|")(?<name>.*?)('|")(,|\))/gi) || [])]
				.map(match => path.join(
					viewsRelativeDirectory,
					addExtIfMissing(match.groups.name)
				));
			module.dependencies.push(...viewNames);
			cruiseModules.push(...viewNames.map(name => ({ source: name, dependencies: []})));
		}
	}

	response.send({
		modules: cruiseModules,
		root,
		views: {
			directory: viewsRelativeDirectory,
			extension: SETTINGS.views.extension
		},
		VERSION: VERSION
	});
});

server.get('/events', handleSSERequests)


server.get('/reset', (request, response) => {
	REQUESTS.clear();
	response.redirect(request.originalUrl);
});

server.get('/requests', function sendRequests(_, response){
	response.set('Content-Type', 'application/json');
	response.send(JSON.stringify(serialize(Object.fromEntries([...REQUESTS.entries()].filter(([key]) => key !== 'latest')), { json: true })));
});
server.get('/delete-request/:id', function deleteRequest(request, response){
	const id = +request.params.id;
	if (!id) return response.status(404).end();
	if (!REQUESTS.has(id)) return response.status(400).end();

	REQUESTS.delete(id);
	return response.status(200).end();
})
server.patch('/update-request/:id', express.json(), function updateRequest(request, response){
	const id = +request.params.id;
	if (!id) return response.status(404).end();
	if (!REQUESTS.has(id)) return response.status(400).end();

	Object.assign(REQUESTS.get(id), request.body);
	return response.status(200).end();
})

module.exports = server