import { join } from "node:path";
import { readJsonFile } from "./readJsonFile.js";
import { writeJsonFile } from "./writeJsonFile.js";

type EnsureHostInput = string | ({ host:string; port?:string|number;} | string)[];

type EnsureHostOutput = { host?:string; port?:string|number; };

function ensureHost(input?: EnsureHostInput): EnsureHostOutput {
	if (!input) return {};
	const first = Array.isArray(input) ? input[0] : input;
	const [host, port] = typeof(first) === "string" ? first.split(":") : [first.host, first.port];
	return { host, port };
}

const ScriptKeys = ["pre-setup","post-setup","pre-deploy-local","pre-deploy","post-deploy"] as const;
type ScriptKey = typeof ScriptKeys[number];

type DeployJson = Record<string, any> & Record<ScriptKey, string | string[] | undefined>;

function formatScript({ where, codeName }: Record<string, string>, json: DeployJson, key: ScriptKey) {
	// gotta have json and key
	if (!json || !key) return undefined;

	// get script from json
	let script = json[key];
	if (!script) return script;

	// ensure script is string
	script = Array.isArray(script) ? script.join("; ") : script;

	// ensure valid host data
	const host = ensureHost(json.host);

	json[key] = script
		.replaceAll("${where}", where)
		.replaceAll("${codeName}", codeName)
		.replaceAll("${user}", json.user ?? "")
		.replaceAll("-i ${key}", json.key ? "-i " + json.key : "")
		.replaceAll("${host}", host?.host ?? "")
		.replaceAll("-P ${port}", host?.port ? "-P " + host.port : "")
		.replaceAll("${botRoot}", json?.botRoot)
		;

	return json[key];
}

/**
 * create deploy json files for deploying the bot or services
 */
export async function writeDeployJson<T extends Record<string, string>>(args: T) {
	const configJson: Record<string, any> = await readJsonFile(`./config/config.json`).catch(() => ({})) ?? {};

	const deployJson: DeployJson = {
		// base deploy json
		...configJson["deploy"],
		// overwrites for where/ghost
		...(configJson[args.where] ?? {})["deploy"],
		// overwrite for codeName
		codeName:args.codeName
	};

	ScriptKeys.forEach(scriptKey => formatScript(args, deployJson, scriptKey));
	deployJson.host = [ensureHost(deployJson.host)];
	deployJson.ref = deployJson.ref?.replaceAll("${branch}", args.branch);
	deployJson.path = deployJson.botRoot ? join(deployJson.botRoot, args.where) : undefined;

	await writeJsonFile(`./config/deploy-${args.what}-${args.where}.json`, deployJson);
}