import { isOffline, requests } from "./globals.js";


export function deleteRequest(id){
	if (localStorage.getItem('importing-requests')) {
		delete requests[id]
		localStorage.setItem('importing-requests', JSON.stringify(serialize(requests)))
	}
	if (!isOffline) return fetch('./delete-request/' + id).catch(console.error);
}

export function updateRequest(id, updates){
	if (localStorage.getItem('importing-requests')) {
		const foundRequest = requests[id] || {}
		for (const key of ['label']){
			if (key in updates) {
				const value = updates[key]
				if (value === undefined) delete foundRequest[key]
				else foundRequest[key] = value
			}
		}
		localStorage.setItem('importing-requests', JSON.stringify(serialize(requests)))
	}
	if (!isOffline) return fetch('./update-request/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
}

export function updateEvent(requestId, eventStart, updates){
	if (localStorage.getItem('importing-requests')) {
		const foundRequest = requests[requestId] || { events: [] }
		const event = foundRequest.events.find(e => e.start === eventStart);

		for (const key of ['annotation', 'diffs', 'locals', 'body', 'json', 'args', 'reason', 'value']){
			if (key in updates) {
				const value = updates[key];
				if (value === undefined) delete event[key];
				else event[key] = value;
			}
		}
		localStorage.setItem('importing-requests', JSON.stringify(serialize(requests)))
	}
	if (!isOffline) return fetch('./update-event/' + requestId + '/' + eventStart, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
}

export function deleteEvent(requestId, eventStart){
	if (localStorage.getItem('importing-requests')) {
		const foundRequest = requests[requestId] || { events: [] }
		const eventIndex = foundRequest.events.findIndex(e => e.start === eventStart);
		if (eventIndex !== -1) foundRequest.events.splice(eventIndex, 1)

		localStorage.setItem('importing-requests', JSON.stringify(serialize(requests)))
	}
	if (!isOffline) return fetch('./delete-event/' + requestId + '/' + eventStart, { method: 'DELETE' }).catch(console.error);
}