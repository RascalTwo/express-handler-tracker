const path = require('path');
const fs = require('fs');

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
	entryPoint: process.cwd() + '/index.js',
	views: {
		directory: undefined,
		extension: undefined
	},
	attachAsyncProxiesToLatestRequest: false,
	ignoreRequests: {
		regexes: [],
		callbacks: []
	}
}

const REQUESTS = new Map();

const FUNCTION_LOCATIONS = new Map();

const SSE = {
	heartbeatInterval: null,
	backflow: [],
	clients: []
}

const VERSION = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'))).version

module.exports = { SETTINGS, REQUESTS, FUNCTION_LOCATIONS, SSE, VERSION }