import { readFileSync } from "fs";
import { error } from "../../console/loggers/error.js";
import { parseJson } from "../../json/parseJson.js";

let _json: Record<string, string | number>;

/**
 * @internal
 * Looks for an environment variable in the ./config/env.json
 * @param key the key to check
 * @returns
 */
export function getFromEnvJson(key: string): string | number | undefined {
	if (!_json) {
		const path = "./config/env.json";
		try {
			_json = parseJson(readFileSync(path).toString());
		}catch {
			error(`Unable to read: ${path}`);
			_json = { };
		}
	}

	if (key in _json) {
		return _json[key];
	}

	return undefined;
}