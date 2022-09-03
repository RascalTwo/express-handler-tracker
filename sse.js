const Flatted = require('flatted');

const { SSE, REQUESTS } = require('./globals');
const { delay, normalizeEvent } = require('./helpers')

const startSSEPiping = async () => {
	while (true) {
		await delay(1000)
		const chunks = SSE.backflow.splice(0, SSE.backflow.length);
		if (!chunks.length) continue;

		for (const chunk of chunks) chunk.event = await normalizeEvent(chunk.event);

		const newRequests = {};
		for (const chunk of chunks) {
			const info = REQUESTS.get(chunk.id);
			if (!info) continue;
			if (!(chunk.id in newRequests)) newRequests[chunk.id] = { start: info.start, events: [] };
			newRequests[chunk.id].events.push(chunk.event);
			newRequests[chunk.id].events.sort((a, b) => a.start - b.start) || a.order - b.order;
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