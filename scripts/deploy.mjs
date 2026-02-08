import { fileExistsSync, readJsonFile, writeFile } from "@rsc-utils/io-utils";
import { createInterface } from 'node:readline/promises';

function readBranches() {
	const branches = ["develop", "beta", "main", "pnpm"];
	// ./git/refs/heads        ==> non-release branches
	// .git/refs/heads/release ==> release branches
	return branches;
}

/** @typedef {"deploy"|"env"|undefined} Action */
/** @typedef {"local"|"docker"|"dev"|"beta"|"stable"|undefined} Where */
/** @typedef {"dev"|"beta"|"stable"} CodeName */
/** @typedef {"bot"|"map"|"services"|undefined} What */
/** @typedef {"npm-ci"|"npm-update"|"npm-ci-update"|undefined} NodeModules */
/** @typedef {"ghost"|undefined} Ghost */
/** @typedef {"--force"|undefined} Force */

const argData = {
	action: { argIndex:0, prompt:"Action:", values:["deploy","env"], defValue:"env" },
	where: { argIndex:1, prompt:"Where:", values:["local","docker","dev","beta","stable"], defValue:"local" },
	codeName: { argIndex:2, prompt:"Code Name:", values:["dev","beta","stable"], defValue:"dev" },
	what: { argIndex:3, prompt:"What:", values:["bot","map","pdf","random","search","all","services"], defValue:"bot" },
	branch: { argIndex:4, prompt:"Branch:", values:readBranches(), defValue:"develop" },
	nodeModules: { argIndex:5, prompt:"Node Modules:", values:["npm-ci","npm-update","npm-ci-update"], defValue:undefined },
	ghost: { prompt:"Ghost Mode?", values:["ghost"], defValue:undefined },
	force: { prompt:"Force Deploy?", values:["--force"], defValue:undefined },
};

// Function to prompt user with options
async function promptUser(argKey) {
	return new Promise(async resolve => {
		const readline = createInterface({
			input: process.stdin,
			output: process.stdout
		});

		const { prompt, values, defValue } = argData[argKey];

		// Create question text
		let promptText = prompt;
		values.forEach((value, index) => {
			promptText += `${index ? ", " : " "}${index + 1}. ${value}${value === defValue ? " (def)" : ""}`;
		});
		promptText += ": ";

		// get user input
		const answer = (await readline.question(promptText).catch(() => process.exit(1))).toLowerCase();
		if (["quit","q","exit","x"].includes(answer)) {
			console.log("Exiting...");
			process.exit(1);
		}

		// convert user input to value index
		const index = values.includes(answer)
			// indexOf value
			? values.indexOf(answer)
			// number - 1
			: +answer - 1;

		// get value (or undefined) by index
		const value = values[index];

		// if no input was given and we have a default value
		if (!answer && defValue) {
			readline.close();
			resolve(defValue);
			return;
		}

		if (answer && !value) {
			console.warn("\tInvalid value: " + answer);
			process.exit(1);
		}

		readline.close();
		resolve(value);
	});
}

/** @typedef {{ action:Action; where:Where; codeName:CodeName; what:What; branch:string; nodeModules?:NodeModules; ghost?:Ghost; force?:Force; }} Args */

async function getArgs() {
	/** @type {Args} */
	const args = { };
	const argKeys = Object.keys(argData);
	const cliArgs = process.argv.slice(2);
	const noPrompt = cliArgs.includes("--noPrompt");
	for (let i = 0; i < argKeys.length; i++) {
		const argKey = argKeys[i];
		const { argIndex, prompt, values } = argData[argKey];
		let cliArg = cliArgs.find((arg, cliIndex) => (!argIndex || argIndex === cliIndex) && values.includes(arg));
		if (cliArg) {
			console.log(prompt + " " + cliArg);
		}else if (!noPrompt) {
			cliArg = await promptUser(argKey).catch(console.error);
		}
		args[argKey] = cliArg;

		// we don't need any other args to just update env.json
		if (args.action === "env" && i === 1) break;

		// we can't deploy locally, so just stop here
		if (args.action === "deploy" && args.where === "local") {
			console.warn("Cannot deploy to local!");
			process.exit(1);
		}
	}
	return args;
}

/** @param {string|({host:string;port?:string|number;}|string)[]|undefined} input */
function ensureHost(input) {
	if (!input) return {};
	const first = Array.isArray(input) ? input[0] : input;
	const [host, port] = typeof(first) === "string" ? first.split(":") : [first.host, first.port];
	return { host, port };
}

/**
 * @param {Args} args
 * @param {Record<string, any> & Record<"pre-setup"|"post-setup"|"pre-deploy-local"|"pre-deploy"|"post-deploy", string | string[] | undefined>} json
 * @param {"pre-setup"|"post-setup"|"pre-deploy-local"|"pre-deploy"|"post-deploy"} key
 */
function formatScript({ nodeModules, where, codeName }, json, key) {
	// gotta have json and key
	if (!json || !key) return undefined;

	// get script from json
	let script = json[key];
	if (!script) return script;

	// ensure script is string
	script = Array.isArray(script) ? script.join("; ") : script;

	// ensure valid host data
	const host = ensureHost(json.host);

	// ensure valid npm install script
	const npmInstall = nodeModules === "npm-ci" ? "npm ci;"
		: nodeModules === "npm-update" ? "npm update;"
		: nodeModules === "npm-ci-update" ? "npm ci; npm update;"
		: "";

	json[key] = script
		.replaceAll("${where}", where)
		.replaceAll("${codeName}", codeName)
		.replaceAll("${user}", json.user ?? "")
		.replaceAll("-i ${key}", json.key ? "-i " + json.key : "")
		.replaceAll("${host}", host?.host ?? "")
		.replaceAll("-P ${port}", host?.port ? "-P " + host.port : "")
		.replaceAll("${botRoot}", json?.botRoot)
		.replaceAll("npm ci;", npmInstall)
}

async function execCli(cmd, ...args) {
	const { spawn } = await import('child_process');
	const proc = spawn(cmd, args, { stdio: 'inherit' });

	await new Promise((resolve, reject) => {
		proc.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`${cmd} compose exited with code ${code}`));
			}
		});

		proc.on('error', (error) => {
			reject(error);
		});
	});
}

/**
 * create env json files for running the bot or services
 * @param {Args} args
 * @param {Record<string, any>} json
 */
async function writeEnvJson({ where, ghost }, json) {
	const filePath = where === "local" || ghost
		// create env for local development use
		? `./config/env.json`
		// create env for deployment
		: `./config/env-${where}.json`;

	if (fileExistsSync(filePath)) {
		console.log(`Overwriting: ${filePath}`);

	}else {
		console.log(`Writing: ${filePath}`);
	}

	await writeFile(filePath, json, { formatted:true });
}

/**
 * create deploy json files for deploying the bot or services
 * @param {Args} args
 * @param {Record<string, any>} json
 */
async function writeDeployJson(args, json) {
	["pre-setup","post-setup","pre-deploy-local","pre-deploy","post-deploy"].forEach(scriptKey => {
		formatScript(args, json, scriptKey);
	});
	json.host = [ensureHost(json.host)];
	json.ref = json.ref?.replaceAll("${branch}", args.branch);
	json.path = json.botRoot ? json.botRoot + "/" + args.where : undefined;

	await writeFile(`./config/deploy-${args.what}-${args.where}.json`, json, { formatted:true });
}

async function main() {

	const args = await getArgs();

	const configJson = await readJsonFile(`./config/config.json`).catch(() => ({}));
	const whereJson = configJson[args.where] ?? {};

	// create env json files for running the bot or services
	const envJson = { ...configJson["env"], ...whereJson[args.ghost ?? "env"], codeName:args.codeName };
	await writeEnvJson(args, envJson);

	// if we are just writing env.json, then exit now
	if (args.action === "env") return;

	// create deploy json files for deploying the bot or services
	const deployJson = { ...configJson["deploy"], ...whereJson["deploy"], codeName:args.codeName };
	await writeDeployJson(args, deployJson);

	if (args.what === "bot" && args.where === "docker") {
		await execCli("docker", "compose", "up", "-d").catch(() => undefined);
		await execCli("pm2", "deploy", "bot.config.cjs", args.where, args.force).catch(() => undefined);

	}else if (args.what === "bot" && args.where === "dev" & args.branch === "develop") {
		await execCli("pm2", "deploy", "bot.config.cjs", args.where);

	}else if (args.what === "bot" && args.where === "beta" & args.branch === "beta") {
		await execCli("pm2", "deploy", "bot.config.cjs", args.where);

	}else if (args.what === "bot" && args.where === "stable" & args.branch === "main") {
		await execCli("pm2", "deploy", "bot.config.cjs", args.where);

	}else {

		console.log("Nothing else works yet.");
		process.exit(1);
	}

}
main();