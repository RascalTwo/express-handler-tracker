const Flatted = require('flatted');
const { MIDDLEWARE_WAIT_TIME } = require('./constants');

const { SSE, REQUESTS } = require('./globals');
const { delay, normalizeEvent } = require('./helpers')

const startSSEPiping = async () => {
	while (true) {
		await delay(1000)
		const chunks = SSE.backflow.splice(0, SSE.backflow.length);
		if (!chunks.length) continue;

		const chunksByRequests = {};
		for (const chunk of chunks) {
			if (!(chunk.id in chunksByRequests)) chunksByRequests[chunk.id] = [];
			chunksByRequests[chunk.id].push(chunk)
			chunksByRequests[chunk.id].sort((a, b) => b.end - a.end)
		}


		const holding = [];
		const now = Date.now();
		for (const chunks of Object.values(chunksByRequests)) {
			const latest = chunks[0];
			if (now - latest.event.end <= MIDDLEWARE_WAIT_TIME * 2) {
				delete chunksByRequests[latest.id];
				holding.push(...chunks);
			}
		}
		SSE.backflow.push(...holding);

		const readyChunks = Object.values(chunksByRequests).flat();

		for (const chunk of readyChunks) chunk.event = await normalizeEvent(chunk.event, REQUESTS.get(chunk.id)?.events.filter(event => event.order < chunk.event.order) || []);

		const newRequests = {};
		for (const chunk of readyChunks) {
			const info = REQUESTS.get(chunk.id);
			if (!info) continue;
			if (!(chunk.id in newRequests)) newRequests[chunk.id] = { start: info.start, events: [] };
			newRequests[chunk.id].events.push(chunk.event);
			newRequests[chunk.id].events.sort((a, b) => a.start - b.start || a.order - b.order);
		}

		const json = Flatted.stringify(newRequests);
		for (const client of SSE.clients) client.write(`data: ${json}\n\n`);
	}
}

function handleSSERequests(_, response) {
	response.set({
		'Cache-Control': 'no-cache',
		'Content-Type': 'text/event-stream',
		'Connection': 'keep-alive'
	});
	response.flushHeaders();
	response.write('retry: 10000\n\n');

	SSE.clients.push(response);
	response.on('close', () => {
		response.end();
		for (let i = SSE.clients.length; i >= 0; i--) {
			if (SSE.clients[i] === response) return SSE.clients.splice(i, 1);
		}
	})
}

function startSSE(){
	SSE.heartbeatInterval = setInterval(() => {
		for (const client of SSE.clients) client.write(': .\n\n')
	}, 10000);
	startSSEPiping();
}

module.exports = { SSE, handleSSERequests, startSSE }
