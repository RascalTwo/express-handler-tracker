const IGNORED_STACK_SOURCES = [
	'node_modules',
	'node:',
	'anonymous',
	'express-handler-tracker',
	'repl:1:1',
]

const STACK_TRACE_LIMIT = Infinity;

const MIDDLEWARE_WAIT_TIME = 2500;

module.exports = { IGNORED_STACK_SOURCES, STACK_TRACE_LIMIT, MIDDLEWARE_WAIT_TIME }