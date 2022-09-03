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
	response.send({ modules: modules.map(({ source, dependencies }) => ({ source, dependencies: dependencies.map(({ resolved }) => resolved) })), root: path.dirname(path.resolve(SETTINGS.entryPoint)) + '/', viewsDirectory: SETTINGS.viewsDirectory });
});

server.get('/events', handleSSERequests)


server.get('/reset', (request, response) => {
	REQUESTS.clear();
	response.redirect(request.originalUrl);
});

server.get('/requests', function sendRequests(_, response){
	response.set('Content-Type', 'application/json');

	// Array of locate promises
	const locates = [];

	Flatted.stringify(Object.fromEntries(REQUESTS.entries()), (key, value) => {
		if (key === 'handler' && typeof value === 'function') {
			// All unseen functions get a new locate function created that sets the value in the map when completed
			if (!FUNCTION_LOCATIONS.has(value)) {
				FUNCTION_LOCATIONS.set(value, null);
				locates.push(funcLoc.locate(value).then(loc => FUNCTION_LOCATIONS.set(value, loc)).catch(() => undefined));
			}
			return value;
		}
		return value;
	});

	return Promise.all(locates).then(() => {
		for (const value of REQUESTS.values()) {
			for (const [i, event] of value.events.entries()) {
				if (typeof event.handler !== 'function') continue;
				// THIS MUTATES THE REQUESTS PERM
				event.handler = getHandlerInfo(event.handler);
				/*
				if (event.handler.adds?.length <= 1) continue;
				const possible = event.handler.adds;
				for (let j = i - 1; j >= 0; j--){
					const prevHandler = value.events[j].handler;
					if (!prevHandler) continue

					const against = [...prevHandler.adds, [prevHandler.construct]]
					const hits = new Map();
					for (const [k, lines] of possible.entries()){
						let count = 0;
						for (const line of lines){
							for (const other of against){
								if (other.includes(line)) count++
							}
						}
						hits.set(k, count)
					}
				}*/
			}
		}
		response.send(Flatted.stringify(Object.fromEntries(REQUESTS.entries())));
	})
});

module.exports = server