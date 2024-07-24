import { verbose } from "../../console/loggers/verbose.js";
import { stringify } from "../../json/bigint/stringify.js";

/**
 * @internal
 * Convenience to consistently log a key/value pair before returning the value.
 * @param key
 * @param value
 * @returns
 */
export function logAndReturn<T>(key: string, value: string | number): T {
	verbose(`Environment Variable: ${key}=${stringify(value)}`);
	return value as T;
}
