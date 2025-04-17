import { getFromProcessArgv } from "./internal/getFromProcessArgv.js";
import { getFromProcessEnv } from "./internal/getFromProcessEnv.js";
import { logAndReturn } from "./internal/logAndReturn.js";
import type { Validator } from "./types.js";

/**
 * Attempts to get the environment variable by checking process and then args.
 * Each key is checked and then tested, in order, until a valid value is found.
 * If all values are checked an none pass the test, undefined is returned.
 * @param test the test to use when checking validity of the values
 * @param keys the keys to check, in order
 * @returns
 */
export function getFromProcessSafely<T>(test: Validator, ...keys: string[]): T | undefined {
	for (const key of keys) {
		const envValue = getFromProcessEnv(key);
		if (test(envValue)) {
			return logAndReturn(key, envValue);
		}

		const argValue = getFromProcessArgv(key);
		if (test(argValue)) {
			return logAndReturn(key, argValue);
		}
	}
	return undefined;
}