import { info } from "../../console/loggers/info.js";
import { stringifyJson } from "../../json/stringifyJson.js";

/**
 * @internal
 * Convenience to consistently log a key/value pair before returning the value.
 * @param key
 * @param value
 * @returns
 */
export function logAndReturn<T>(key: string, value: string | number): T {
	info(`Environment Variable: ${key}=${stringifyJson(value)}`);
	return value as T;
}
