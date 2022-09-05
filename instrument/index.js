#!/usr/bin/env node

const fs = require('fs');
const childProcess = require('child_process');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { cruise } = require("dependency-cruiser");
const { diff } = require('jest-diff');

const replacers = require('./replacers');


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
	.option('package', { type: 'boolean', description: 'Automatically install/remove package from project' })
	.option('replacers', { type: 'array', description: 'Replacers to process the code:\n' + Object.entries(replacers).map(([name, { description }]) => `- ${name}: ${description}`).join('\n') })
	.check(argv => {
		if (argv.replacers?.some(arg => !(arg in replacers))){
			throw new Error(`Only [${Object.keys(replacers).join(', ')}] are allowed as replacers`)
		}
		return true;
	})
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

const getSelectedReplacers = () => argv.replacers?.length ? argv.replacers.map(name => replacers[name]) : Object.values(replacers)

// Generate string replacements for instrumentation
function collectInstrumentReplacements(content) {
	const replacements = []
	for (const { instrument } of getSelectedReplacers()) replacements.push(...instrument(content, argv));
	return replacements;
}

// Generate string replacements for deinstrumentation
function collectDeinstrumentReplacements(content) {
	const replacements = []
	for (const { deinstrument } of getSelectedReplacers()) replacements.push(...deinstrument(content, argv));
	return replacements;
}

async function performReplacements(generateFunction) {
	const chalk = await import('chalk').then(module => module.default)

	for (const filepath of new Set(collectFilepaths(cruise([argv.entryPoint], { doNotFollow: { path: 'node_modules' }, exclude: ['node_modules', 'express-handler-tracker'] }).output.modules))) {
		const oldFile = fs.readFileSync(filepath).toString()
		const replacements = generateFunction(oldFile)
		if (!replacements.length) continue;
		let newFile = oldFile;
		replacements.sort((a, b) => b.start - a.start)
		for (const { start, end, replacement } of replacements) {
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


function spawnPipedCommand(command, ...args) {
	const child = childProcess.spawn(command, args);
	child.stdout.pipe(process.stdout);
	child.stderr.pipe(process.stderr);
	return child;
}

async function instrument() {
	await performReplacements(collectInstrumentReplacements)

	if (argv.package) spawnPipedCommand('npm', 'install', 'https://github.com/RascalTwo/expess-handler-tracker');
}

async function deinstrument() {
	await performReplacements(collectDeinstrumentReplacements)

	if (argv.package) spawnPipedCommand('npm', 'uninstall', 'https://github.com/RascalTwo/expess-handler-tracker');
}

if (argv._[0] === 'instrument') {
	// If no port && no subRoute, prevent
	const noServer = !argv.port && !argv.subRoute
	if (noServer) console.error('Neither port or subRoute provided, instrumentation will not result in a running server')
	if (!noServer || argv.yesToAll) instrument().catch(console.error);
	else process.exit(1)
}
else if (argv._[0] === 'deinstrument') deinstrument().catch(console.error);
else {
	console.error('Missing command');
	getArgv([...process.argv, '--help'])
	process.exit(1)
}