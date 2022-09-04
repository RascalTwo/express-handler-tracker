const path = require('path')

const express = require('express');
const cors = require('cors');
const Flatted = require('flatted')
const { cruise } = require("dependency-cruiser");
const funcLoc = require('func-loc')

const { SETTINGS, REQUESTS, FUNCTION_LOCATIONS } = require('./globals')

const { handleSSERequests } = require('./sse')
const { getHandlerInfo } = require('./helpers')


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
	const { output: { modules } } = cruise([SETTINGS.entryPoint], { exclude: ['node_modules', 'express-handler-tracker'] });
	const root = path.dirname(path.resolve(SETTINGS.entryPoint)) + '/'
	response.send({
		modules: modules.map(({ source, dependencies }) => ({ source, dependencies: dependencies.map(({ resolved }) => resolved) })),
		root,
		viewsDirectory: path.relative(root, SETTINGS.viewsDirectory)
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