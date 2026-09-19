import { existsSync } from "node:fs";
import { readJsonFile } from "./readJsonFile.js";
import type { CodeName, Ghost, Where } from "./types.js";
import { writeJsonFile } from "./writeJsonFile.js";

type Args = {
	codeName?: CodeName;
	where: Where;
	ghost?: Ghost;
};

/**
 * Create env json files for running the bot or services
 */
export async function writeEnvJson({ codeName, where, ghost }: Args): Promise<void> {
	const configJson: Record<string, any> = await readJsonFile(`./config/config.json`).catch(() => ({})) ?? {};

	const envJson = {
		// base env json
		...configJson["env"],
		// overwrites for where/ghost
		...(configJson[where] ?? {})[ghost ?? "env"],
		// overwrite for codeName
		codeName
	};

	const filePath = where === "local" || ghost
		// create env for local development use
		? `./config/env.json`
		// create env for deployment
		: `./config/env-${where}.json`;

	if (existsSync(filePath)) {
		console.log(`Overwriting: ${filePath}`);

	}else {
		console.log(`Writing: ${filePath}`);
	}

	await writeJsonFile(filePath, envJson);
}