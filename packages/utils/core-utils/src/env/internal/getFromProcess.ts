import { getFromProcessArgv } from "./getFromProcessArgv.js";
import { getFromProcessEnv } from "./getFromProcessEnv.js";
import { logAndReturn } from "./logAndReturn.js";

type Validator = (value: string | number | null | undefined) => value is string | number;

/**
 * @internal
 * Attempts to get the environment variable by checking process and then args.
 * Each key is checked, and then tested.
 * If all values are checked an none pass the test, then an error is thrown.
 * @param test the test to use when checking validity of the values
 * @param keys the keys to check, in order
 * @returns
 */
export function getFromProcess<T>(test: Validator, ...keys: string[]): T {
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
	throw new Error(`Environment Variable Missing: ${keys}`);
}