// Uninstrumented `const router = express.Router()` variations, extract `const`, `router`, and `express.Router()`
const ROUTER_UNINSTRUMENTED_REGEX = /(?<declarationKeyword>const|var|let)? ?(?<variable>.*?) ?= ?(?<value>.*?router.*?\(\));?/ig;

// Instrumented `const app = require('@rascal_two/express-handler-tracker')(express.Router())`, extract `const`, `app`, and `express.Router()`
const ROUTER_INSTRUMENTED_REGEX = /(?<declarationKeyword>const|var|let)? ?(?<variable>.*?) ?= ?require\((?<quote>'|"|`).*?\4\)\((?<value>.*?router.*?\(\))\);?/ig


module.exports = {
	instrument(content) {
		const replacements = []

		for (const match of [...content.matchAll(ROUTER_UNINSTRUMENTED_REGEX)].reverse()) {
			if (match[0].includes('@rascal_two/express-handler-tracker')) continue
			const { declarationKeyword, variable, value } = match.groups;
			replacements.push({ start: match.index, end: match.index + match[0].length, replacement: `${declarationKeyword ? declarationKeyword + ' ' : ''}${variable} = require('@rascal_two/express-handler-tracker')(${value});` });
		}

		return replacements
	},
	deinstrument(content) {
		const replacements = [];

		for (const match of [...content.matchAll(ROUTER_INSTRUMENTED_REGEX)].reverse()) {
			const { declarationKeyword, variable, value } = match.groups;
			replacements.push({
				start: match.index,
				end: match.index + match[0].length,
				replacement: `${declarationKeyword ? declarationKeyword + ' ' : ''}${variable} = ${value};`
			});
		}

		return replacements
	}
}