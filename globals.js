const SETTINGS = {
	diffExcludedProperties: [
		'^__r2',
		'^client$',
		'^_readableState$',
		'^next$',
		'^req$',
		'^res$',
		'^socket$',
		'^host$',
		'^sessionStore$'
	].map(s => new RegExp(s)),
	entryPoint: undefined,
	viewsDirectory: undefined
}

const REQUESTS = new Map();

const FUNCTION_LOCATIONS = new Map();

const SSE = {
	heartbeatInterval: null,
	backflow: [],
	clients: []
}

module.exports = { SETTINGS, REQUESTS, FUNCTION_LOCATIONS, SSE }