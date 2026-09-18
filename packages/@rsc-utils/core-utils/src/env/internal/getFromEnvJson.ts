import { parseJson } from "@rsc-utils/json-utils";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { error } from "../../console/loggers/error.js";
import type { ValidatorArg } from "../types.js";

let _json: Record<string, ValidatorArg>;

/**
 * @internal
 * Looks for an environment variable in the ./config/env.json
 * @param key the key to check
 * @returns
 */
export function getFromEnvJson(key: string): ValidatorArg | undefined {
	if (!_json) {
		const path = join(".", "config", "env.json");
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