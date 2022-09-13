let fails = 1;
const connectionIndicator = document.querySelector('#connection-indicator');
export function setupEventSource(requests, onUpdate) {
	const es = new EventSource('./events');
	connectionIndicator.dataset.readyState = es.readyState
	es.addEventListener('open', () => {
		connectionIndicator.dataset.readyState = es.readyState
		fails = 0;
	})
	es.addEventListener('message', event => {
		fails = 0;
		const newRequests = deserialize(JSON.parse(event.data));
		for (const [id, request] of Object.entries(newRequests)) {
			if (!(id in requests)) {
				requests[id] = request;
				const events = request.events.reverse().filter((e, i) => request.events.findIndex(o => o.start === e.start) === i).reverse();
				requests[id].events = events;
				continue;
			}
			for (const event of request.events) {
				const existsIndex = requests[id].events.findIndex(e => e.start === event.start);
				if (existsIndex !== -1) requests[id].events.splice(existsIndex, 1, event);
				else requests[id].events.push(event);
			}

			requests[id].events.sort((a, b) => a.start - b.start);
		}
		onUpdate()
	});

	es.addEventListener('error', err => {
		fails++;
		connectionIndicator.dataset.readyState = es.readyState;
		console.error(err);
		if (es.readyState === 2) {
			es.close()
			setTimeout(() => setupEventSource(requests, onUpdate), 5000 * fails);
		}
	});
}