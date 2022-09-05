const util = require('util');

// Uninstrumented `const app = express()` variations, extract `const`, `app`, and `express()`
const SERVER_UNINSTRUMENTED_REGEX = /(?<declarationKeyword>const|var|let)? ?(?<variable>.*?) ?= ?(?<value>require\((?<quote>'|"|`)express\4\)\(\)|express\(\));?/ig;

// Instrumented `const app = require('@rascal_two/express-handler-tracker')(express(), )`, extract `const`, `app`, and `express()`
const SERVER_INSTRUMENTED_REGEX = /(?<declarationKeyword>const|var|let)? ?(?<variable>.*?) ?= ?require\((?<quote>'|"|`).*?\4\)\((?<value>.*?),[\s\S]*?\);?/ig
// Detection of multiline instrumentation
const MULTILINE_INSTRUMENTED_REGEX = /\/\/ Begin `express-handler-tracker` instrumentation[\s\S]*?\/\/ End `express-handler-tracker` instrumentation/ig

// Parsing of multiline instrumentation, extract `const`, `app`, and `express()`
const SERVER_MULTILINE_INSTRUMENTED_REGEX = /\/\/ Begin `express-handler-tracker` instrumentation\n.*?\n(?<declarationKeyword>const|var|let)? ?(?<variable>.*?) ?= ?(?<value>require\((?<quote>'|"|`)express\4\)\(\)|express\(\));?\n.*?\n.*?\n.*?\/\/ End `express-handler-tracker` instrumentation/ig


module.exports = {
	instrument(content, argv) {
		let options = {
			entryPoint: argv.entryPoint,
			port: argv.port,
			diffExcludedProperties: argv.diffExcludedProperties
		}
		for (const key in options) if (options[key] === undefined) delete options[key]
		if (!Object.keys(options).length) options = undefined;

		const optionsString = options ? ', ' + util.inspect(options, { depth: null }) : ''

		const replacements = []
		for (const match of [...content.matchAll(SERVER_UNINSTRUMENTED_REGEX)].reverse()) {
			const start = match.index, end = start + match[0].length
			let alreadyDone = false;
			for (const alreadyInstrumented of content.matchAll(MULTILINE_INSTRUMENTED_REGEX)) {
				const alreadyStart = alreadyInstrumented.index, alreadyEnd = alreadyStart + alreadyInstrumented[0].length;
				if (start >= alreadyStart && start <= alreadyEnd && end >= alreadyStart && end <= alreadyEnd) {
					alreadyDone = true;
					break;
				}
			}
			// Don't perform instrumentation to already-instrumented multiline instrumentation
			if (alreadyDone) continue
			const { declarationKeyword, variable, value, quote = "'" } = match.groups;
			let replacement = '';
			if (argv.subRoute) {
				replacement = [
					'// Begin `express-handler-tracker` instrumentation',
					`const instrumentor = require(${quote}@rascal_two/express-handler-tracker${quote});`,
					`${!declarationKeyword || declarationKeyword === 'const' ? 'let' : declarationKeyword} ${variable} = ${value};`,
					`${variable}.use(${quote}${argv.subRoute}${quote}, instrumentor.server);`,
					`${variable} = instrumentor(${variable}${optionsString});`,
					'// End `express-handler-tracker` instrumentation',
				].join('\n')
			} else {
				replacement = `${declarationKeyword ? declarationKeyword + ' ' : ''}${variable} = require(${quote}@rascal_two/express-handler-tracker${quote})(${value}${optionsString});`
			}
			replacements.push({ start, end, replacement });
		}

		return replacements
	},
	deinstrument(content) {
		const replacements = [];

		for (const match of [...content.matchAll(SERVER_INSTRUMENTED_REGEX), ...content.matchAll(SERVER_MULTILINE_INSTRUMENTED_REGEX)].reverse()) {
			const { declarationKeyword, variable, value } = match.groups;
			replacements.push({
				start: match.index,
				end: match.index + match[0].length,
				replacement: `${declarationKeyword ? declarationKeyword + ' ' : ''}${variable} = ${value};`
			});
		}

		return replacements
	},
	description: 'Express Application'
}