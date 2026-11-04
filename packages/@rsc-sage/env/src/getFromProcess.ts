
import { parseKeyValueArg } from "@rsc-utils/arg-utils";
import { parseJson } from "@rsc-utils/json-utils";
import { Logger } from "@rsc-utils/logger-utils";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { logAndReturn } from "./internal/logAndReturn.js";
import type { Validator, ValidatorArg } from "./types.js";

//#region read the key from env.json as { key:"value" }

let _json: Record<string, ValidatorArg>;

/**
 * Looks for an environment variable in the ./config/env.json
 * @param key the key to check
 */
function getFromEnvJson(key: string): ValidatorArg | undefined {
	if (!_json) {
		const path = join(".", "config", "env.json");
		try {
			_json = parseJson(readFileSync(path).toString());
		}catch {
			Logger.package("@rsc-sage/env").error(`Unable to read: ${path}`);
			_json = { };
		}
	}

	if (key in _json) {
		return _json[key];
	}

	return undefined;
}

//#endregion

//#region read the key from process args as key="value"

/**
 * @internal
 * Looks for an environment variable, as passed on the command line as: key="value"
 * @param keys the key to check
 */
function getFromProcessArgv(key: string): string | undefined {
	for (const arg of process.argv) {
		const pair = parseKeyValueArg(arg);
		if (pair?.key === key && pair?.value) {
			return pair.value;
		}
	}
	return undefined;
}

//#endregion

//#region getFromProcessEnv

/**
 * Looks for an environment variable, as set by PM2 ecosystem files.
 * @param key the key to check
 */
function getFromProcessEnv(key: string): string | undefined {
	if (key in process.env) {
		return process.env[key];
	}
	return undefined;
}

//#endregion

//#region getFromProcessSafely

/** should check json if not in env/arg */
let _getFromEnvJson: boolean | undefined;

/**
 * Attempts to get the environment variable by checking process and then args.
 * Each key is checked and then tested, in order, until a valid value is found.
 * If all values are checked an none pass the test, undefined is returned.
 * @param test the test to use when checking validity of the values
 * @param keys the keys to check, in order
 * @returns
 */
export function getFromProcessSafely<T>(test: Validator, ...keys: string[]): T | undefined {
	_getFromEnvJson ??= process.argv.includes("--getFromEnvJson");

	for (const key of keys) {
		// command line args should take precendent
		const argValue = getFromProcessArgv(key);
		if (test(argValue)) {
			return logAndReturn("argv", key, argValue);
		}

		// follow up with ENV args
		const envValue = getFromProcessEnv(key);
		if (test(envValue)) {
			return logAndReturn("env", key, envValue);
		}

		if (_getFromEnvJson) {
			// check the config/env.json
			const jsonValue = getFromEnvJson(key);
			if (test(jsonValue)) {
				return logAndReturn("json", key, jsonValue);
			}
		}
	}
	return undefined;
}

//#endregion

//#region getFromProcess

/**
 * Attempts to get the environment variable by checking process and then args.
 * Each key is checked, and then tested.
 * If all values are checked an none pass the test, then an error is thrown.
 * @param test the test to use when checking validity of the values
 * @param keys the keys to check, in order
 * @returns
 */
export function getFromProcess<T>(test: Validator, ...keys: string[]): T {
	const value = getFromProcessSafely(test, ...keys);
	if (value !== undefined) {
		return value as T;
	}
	throw new Error(`Environment Variable Missing: ${keys}`);
}

//#endregion
