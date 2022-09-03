const fs = require('fs');
const path = require('path');
const util = require('util');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { cruise } = require("dependency-cruiser");
const { diff } = require('jest-diff');


// Uninstrumented `const app = express()` variations, extract `const`, `app`, and `express()`
const SERVER_UNINSTRUMENTED_REGEX = /(?<declarationKeyword>const|var|let)? ?(?<variable>.*?) ?= ?(?<value>require\((?<quote>'|"|`)express\4\)\(\)|express\(\));?/ig;

// Instrumented `const app = require('@rascal_two/express-handler-tracker')(express(), )`, extract `const`, `app`, and `express()`
const SERVER_INSTRUMENTED_REGEX = /(?<declarationKeyword>const|var|let)? ?(?<variable>.*?) ?= ?require\((?<quote>'|"|`).*?\4\)\((?<value>.*?),[\s\S]*?\);?/ig
// Detection of multiline instrumentation
const MULTILINE_INSTRUMENTED_REGEX = /\/\/ Begin `express-handler-tracker` instrumentation[\s\S]*?\/\/ End `express-handler-tracker` instrumentation/ig

// Parsing of multiline instrumentation, extract `const`, `app`, and `express()`
const SERVER_MULTILINE_INSTRUMENTED_REGEX = /\/\/ Begin `express-handler-tracker` instrumentation\n.*?\n(?<declarationKeyword>const|var|let)? ?(?<variable>.*?) ?= ?(?<value>require\((?<quote>'|"|`)express\4\)\(\)|express\(\));?\n.*?\n.*?\n.*?\/\/ End `express-handler-tracker` instrumentation/ig

// Uninstrumented `const router = express.Router()` variations, extract `const`, `router`, and `express.Router()`
const ROUTER_UNINSTRUMENTED_REGEX = /(?<declarationKeyword>const|var|let)? ?(?<variable>.*?) ?= ?(?<value>.*?router.*?\(\));?/ig;

// Instrumented `const app = require('@rascal_two/express-handler-tracker')(express.Router())`, extract `const`, `app`, and `express.Router()`
const ROUTER_INSTRUMENTED_REGEX = /(?<declarationKeyword>const|var|let)? ?(?<variable>.*?) ?= ?require\((?<quote>'|"|`).*?\4\)\((?<value>.*?router.*?\(\))\);?/ig

// Attempt to guess default entry point based on current working directory
const defaultEntryPoint = (() => {
	const ORDER = ['index', 'main', 'app', 'server']
	const cwd = process.cwd();
	// Order by position in above array
	return fs.readdirSync(cwd).filter(filename => filename.endsWith('.js')).sort((a, b) => {
		const ai = ORDER.findIndex(one => a.includes(one));
		const bi = ORDER.findIndex(one => b.includes(one));
		if (ai === -1 && bi === -1) return 0;
		else if (ai === -1) return 1;
		else if (bi === -1) return -1;
		return ai - bi;
	})[0];
})()


const getArgv = rawArgv => yargs(hideBin(rawArgv))
	.option('entryPoint', {
		type: 'string',
		default: defaultEntryPoint,
		description: 'Where to start inspecting dependencies',
		demand: !defaultEntryPoint
	})
	.option('port', {
		type: 'number',
		description: 'Port to start EHT server on'
	})
	.option('diffExcludedProperties', {
		type: 'array',
		description: 'Regexes of root properties to ignore when generating request & response differences',
	})
	.option('subRoute', {
		type: 'string',
		description: 'Route to expose EHT server in existing Express Application'
	})
	.option('yesToAll', { type: 'boolean', description: 'Approve of all changes without prompt' })
	.command('instrument', 'Instrument code')
	.command('deinstrument', 'Remove instrumentation from code')
	.strictCommands()
	.strictOptions()
	.argv

const argv = getArgv(process.argv)

// Get confirmation from user
async function getConfirmation() {
	if ('yesToAll' in argv) return argv.yesToAll
	return import('inquirer')
		.then(inquirer => inquirer.default.prompt([{
			type: 'confirm',
			name: 'makeChanges',
			message: 'Make proposed changes?',
			default: false
		}]))
		.then(({ makeChanges }) => makeChanges);
}

// Collect all dependency filepaths
function collectFilepaths(modules) {
	return modules.filter(module => !module.coreModule)
		.flatMap(module => [
			module.source,
			...(module.dependencies || [])
				.filter(dep => !dep.coreModule && dep.dependencyTypes.includes('local'))
				.map(dep => dep.resolved),
			...(module.dependents || [])
		])
}

// Generate string replacements for instrumentation
function generateInstrumentReplacements(content){
	let options = {
		entryPoint: argv.entryPoint,
		port: argv.port,
		diffExcludedProperties: argv.diffExcludedProperties
	}
	for (const key in options) if (options[key] === undefined) delete options[key]
	if (!Object.keys(options).length) options = undefined;

	const optionsString = options ? ', ' + util.inspect(options, { depth: null }) : ''


	const replacements = []
	for (const match of [...content.matchAll(SERVER_UNINSTRUMENTED_REGEX)].reverse()){
		const start = match.index, end = start + match[0].length
		let alreadyDone = false;
		for (const alreadyInstrumented of content.matchAll(MULTILINE_INSTRUMENTED_REGEX)){
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
	for (const match of [...content.matchAll(ROUTER_UNINSTRUMENTED_REGEX)].reverse()){
		if (match[0].includes('@rascal_two/express-handler-tracker')) continue
		const { declarationKeyword, variable, value } = match.groups;
		replacements.push({ start: match.index, end: match.index + match[0].length, replacement: `${declarationKeyword ? declarationKeyword + ' ' : ''}${variable} = require('@rascal_two/express-handler-tracker')(${value});` });
	}
	return replacements;
}

// Generate string replacements for deinstrumentation
function generateDeinstrumentReplacements(content){
	const replacements = []
	for (const match of [...content.matchAll(SERVER_INSTRUMENTED_REGEX), ...content.matchAll(SERVER_MULTILINE_INSTRUMENTED_REGEX)].reverse()){
		const { declarationKeyword, variable, value } = match.groups;
		replacements.push({
			start: match.index,
			end: match.index + match[0].length,
			replacement: `${declarationKeyword ? declarationKeyword + ' ' : ''}${variable} = ${value};`
		});
	}
	for (const match of [...content.matchAll(ROUTER_INSTRUMENTED_REGEX)].reverse()){
		const { declarationKeyword, variable, value } = match.groups;
		replacements.push({
			start: match.index,
			end: match.index + match[0].length,
			replacement: `${declarationKeyword ? declarationKeyword + ' ' : ''}${variable} = ${value};`
		});
	}

	return replacements;
}

async function performReplacements(generateFunction){
	const chalk = await import('chalk').then(module => module.default)

	for (const filepath of new Set(collectFilepaths(cruise([argv.entryPoint], { doNotFollow: { path: 'node_modules' }, exclude: ['node_modules', 'express-handler-tracker'] }).output.modules))) {
		const oldFile = fs.readFileSync(filepath).toString()
		const replacements = generateFunction(oldFile)
		if (!replacements.length) continue;
		let newFile = oldFile;
		replacements.sort((a, b) => b.start - a.start)
		for (const { start, end, replacement } of replacements){
			newFile = newFile.substring(0, start) + replacement + newFile.substring(end);
		}
		console.log(chalk.yellow(`Proposed changes to ${filepath}\n`) + diff(oldFile, newFile,
			{
				aAnnotation: 'Original',
				aColor: chalk.red,
				bAnnotation: 'Modified',
				bColor: chalk.green,
				expand: false,
				contextLines: 1,
			}
		))

		if (!await getConfirmation()) continue;
		fs.writeFileSync(filepath, newFile);
		console.log(chalk.yellow`Changes made`)
	}
}

if (argv._[0] === 'instrument') {
	// If no port && no subRoute, prevent
	const noServer = !argv.port && !argv.subRoute
	if (noServer) console.error('Neither port or subRoute provided, instrumentation will not result in a running server')
	if (!noServer || argv.yesToAll) performReplacements(generateInstrumentReplacements).catch(console.error);
	else process.exit(1)
}
else if (argv._[0] === 'deinstrument') performReplacements(generateDeinstrumentReplacements).catch(console.error);
else {
	console.error('Missing command');
	getArgv([...process.argv, '--help'])
	process.exit(1)
}