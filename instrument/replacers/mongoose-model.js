const util = require('util');


const MONGOOSE_MODEL_UNINSTRUMENTED_REGEX = /(?<symbol>=|:)\s?(?<value>(?<calling>.*?model)\(('|")(?<modelName>.*?)\4,\s?(?<arguments>[\s\S]*)\))/gi

const MONGOOSE_MODEL_INSTRUMENTED_REGEX = /(?<symbol>=|:)\s?require\('@rascal_two\/express-handler-tracker'\)\.proxyInstrument\((?<value>(?<calling>.*?model)\(('|")(?<modelName>.*?)\4,\s?(?<arguments>[\s\S]*)\))[\s\S]*\)/gi

const MONGOOSE_MODEL_PROPERTIES = ['constructor',
	'where',
	'aggregate',
	'applyDefaults',
	'bulkSave',
	'bulkWrite',
	'castObject',
	'cleanIndexes',
	'count',
	'countDocuments',
	'create',
	'createCollection',
	'createIndexes',
	'deleteMany',
	'deleteOne',
	'diffIndexes',
	'discriminator',
	'distinct',
	'ensureIndexes',
	'estimatedDocumentCount',
	'exists',
	'find',
	'findById',
	'findByIdAndDelete',
	'findByIdAndRemove',
	'findByIdAndUpdate',
	'findOne',
	'findOneAndDelete',
	'findOneAndRemove',
	'findOneAndReplace',
	'findOneAndUpdate',
	'hydrate',
	'init',
	'insertMany',
	'inspect',
	'listIndexes',
	'mapReduce',
	'populate',
	'model',
	'remove',
	'where',
	'deleteOne',
	'discriminators',
	'increment',
	'model',
	'remove',
	'save',
	'remove',
	'replaceOne',
	'startSession',
	'syncIndexes',
	'translateAliases',
	'update',
	'updateMany',
	'updateOne',
	'validate',
	'watch',
	'where',
]


module.exports = {
	instrument(content) {
		const replacements = []

		for (const match of [...content.matchAll(MONGOOSE_MODEL_UNINSTRUMENTED_REGEX)].reverse()) {
			if (match[0].includes('@rascal_two/express-handler-tracker')) continue
			const { symbol, value, modelName, arguments } = match.groups;
			replacements.push({
				start: match.index,
				end: match.index + match[0].length,
				replacement: `${symbol} require('@rascal_two/express-handler-tracker').proxyInstrument(${value}, ${util.inspect(modelName)}, ${util.inspect(MONGOOSE_MODEL_PROPERTIES, { depth: null })})`
			});
		}

		return replacements
	},
	deinstrument(content) {
		const replacements = [];

		for (const match of [...content.matchAll(MONGOOSE_MODEL_INSTRUMENTED_REGEX)].reverse()) {
			const { symbol, value } = match.groups;
			replacements.push({
				start: match.index,
				end: match.index + match[0].length,
				replacement: `${symbol} ${value}`
			});
		}

		return replacements
	},
	description: 'Mongoose Models',
	experimental: true
}