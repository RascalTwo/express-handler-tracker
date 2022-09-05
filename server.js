const path = require('path')
const fs = require('fs')

const express = require('express');
const cors = require('cors');
const Flatted = require('flatted')
const { cruise } = require("dependency-cruiser");

const { SETTINGS, REQUESTS } = require('./globals')

const { handleSSERequests } = require('./sse')

let cruiseModules;

const server = express();
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
		const fullExt = '.' + SETTINGS.views.extension
		const addExtIfMissing = name => name + (name.endsWith(fullExt) ? '' : fullExt)
		const { output: { modules } } = cruise([SETTINGS.entryPoint], { exclude: ['node_modules', 'express-handler-tracker'] });
		cruiseModules = modules.map(({ source, dependencies }) => ({ source, dependencies: dependencies.map(({ resolved }) => resolved) }))
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
		}
	});
});

server.get('/events', handleSSERequests)


server.get('/reset', (request, response) => {
	REQUESTS.clear();
	response.redirect(request.originalUrl);
});

server.get('/requests', function sendRequests(_, response){
	response.set('Content-Type', 'application/json');
	response.send(Flatted.stringify(Object.fromEntries(REQUESTS.entries())));
});

module.exports = server