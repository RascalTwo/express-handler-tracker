const util = require('util');


const MONGOOSE_MODEL_UNINSTRUMENTED_REGEX = /(?<symbol>=|:)\s?(?<value>(?<calling>.*?model)\(('|")(?<modelName>.*?)\4,\s?(?<arguments>[\s\S]*)\))/gi

const MONGOOSE_MODEL_INSTRUMENTED_REGEX = /(?<symbol>=|:)\s?require\('@rascal_two\/express-handler-tracker'\)\.proxyInstrument\((?<value>(?<calling>.*?model)\(('|")(?<modelName>.*?)\4,\s?(?<arguments>[\s\S]*)\))[\s\S]*\)/gi

const MONGOOSE_MODEL_PROPERTIES = [
	'constructor',
	'where',
	'bulkSave',
	'bulkWrite',
	'discriminator',
	'hydrate',
	'increment',
]

const MONGOOSE_MODEL_CALLBACK_METHODS = {
	aggregate: -1,
	countDocuments: -1,
	create: -1,
	deleteMany: -1,
	deleteOne: -1,
	distinct: -1,
	estimatedDocumentCount: -1,
	exists: -1,
	find: -1,
	findById: -1,
	findByIdAndDelete: -1,
	findByIdAndRemove: -1,
	findByIdAndUpdate: -1,
	findOne: -1,
	findOneAndDelete: -1,
	findOneAndRemove: -1,
	findOneAndReplace: -1,
	findOneAndUpdate: -1,
	insertMany: -1,
	init: -1,
	populate: -1,
	save: -1,
	remove: -1,
	mapReduce: -1,
	replaceOne: -1,
	startSession: -1,
	update: -1,
	updateMany: -1,
	updateOne: -1,
	validate: -1,
}


module.exports = {
	instrument(content) {
		const replacements = []

		for (const match of [...content.matchAll(MONGOOSE_MODEL_UNINSTRUMENTED_REGEX)].reverse()) {
			if (match[0].includes('@rascal_two/express-handler-tracker')) continue
			const { symbol, value, modelName, arguments } = match.groups;
			replacements.push({
				start: match.index,
				end: match.index + match[0].length,
				replacement: `${symbol} require('@rascal_two/express-handler-tracker').proxyInstrument(${value}, ${util.inspect(modelName)}, ${util.inspect({
					properties: MONGOOSE_MODEL_PROPERTIES,
					callbackMethods: MONGOOSE_MODEL_CALLBACK_METHODS
				}, { depth: null })})`
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