import { readJsonFileSync, writeFileSync } from "@rsc-utils/io-utils";

/** @type {"deploy"|"env"|undefined} */
const base = process.argv.find((arg, i) => i === 2 && ["deploy","env"].includes(arg));

/** @type {"bot"|"map"|"services"|undefined} */
const what = process.argv.find((arg, i) => i === 3 && ["bot","map","services"].includes(arg));

/** @type {"local"|"docker"|"dev"|"beta"|"stable"|undefined} */
const where = process.argv.find((arg, i) => i === 4 && ["local","docker","dev","beta","stable"].includes(arg));

/** @type {"ghost"|undefined} */
const ghost = process.argv.find((arg, i) => arg === "ghost");

const branch = process.argv.find((arg, i) => i === 5 && ![base, what, where, ghost].includes(arg));

if (!base || !what || !where) {
	console.error("node deploy.mjs deploy|env bot|map|services local|docker|dev|beta|stable");
	process.exit(1);
}

/** @type {"dev"|"beta"|"stable"} */
const codeName = ["dev","beta","stable"].includes(where) ? where : "dev";

/** @param {string|({host:string;port?:string|number;}|string)[]|undefined} input */
function ensureHost(input) {
	if (!input) return {};
	const first = Array.isArray(input) ? input[0] : input;
	const [host, port] = typeof(first) === "string" ? first.split(":") : [first.host, first.port];
	return { host, port };
}

/**
 * @param {Record<string, any> & Record<"pre-setup"|"post-setup"|"pre-deploy-local"|"pre-deploy"|"post-deploy", string | string[] | undefined>} json
 * @param {"pre-setup"|"post-setup"|"pre-deploy-local"|"pre-deploy"|"post-deploy"} key
 */
function formatScript(json, key) {
	if (!json || !key) return undefined;
	let script = json[key];
	if (!script) return script;
	script = Array.isArray(script) ? script.join("; ") : script;
	const host = ensureHost(json.host);
	json[key] = script
		.replaceAll("${where}", where)
		.replaceAll("${codeName}", codeName)
		.replaceAll("${user}", json.user ?? "")
		.replaceAll("-i ${key}", json.key ? "-i " + json.key : "")
		.replaceAll("${host}", host?.host ?? "")
		.replaceAll("-P ${port}", host?.port ? "-P " + host.port : "")
		.replaceAll("${botRoot}", json?.botRoot)
}

function main() {

	let configJson;
	try {
		configJson = readJsonFileSync("../config/config.json");
	}catch(ex) {
		configJson = {};
	}

	const baseJson = configJson[base];
	const whereJson = configJson[where] ?? {};
	const whereOptJson = whereJson[ghost ?? base];
	const json = { ...baseJson, ...whereOptJson, codeName };

	// create env json files for running the bot or services
	if (base === "env") {

		// this creates an env for local development use
		if (where === "local" || ghost) {

			writeFileSync("../config/env.json", json, { formatted:true });

		}else {

			writeFileSync(`../config/env-${where}.json`, json, { formatted:true });
		}

	// create deploy json files for deploying the bot or services
	}else {

		["pre-setup","post-setup","pre-deploy-local","pre-deploy","post-deploy"].forEach(scriptKey => {
			formatScript(json, scriptKey);
		});
		json.host = [ensureHost(json.host)];
		json.ref = json.ref?.replaceAll("${branch}", branch);
		json.path = json.botRoot ? json.botRoot + "/" + where : undefined;

		writeFileSync(`../config/deploy-${what}-${where}.json`, json, { formatted:true });

	}

}
main();