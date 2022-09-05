let fails = 1;
const connectionIndicator = document.querySelector('#connection-indicator');
export function setupEventSource(requests, onUpdate) {
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

			requests[id].events.sort((a, b) => a.start - b.start || a.order - b.order);
		}
		onUpdate()
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