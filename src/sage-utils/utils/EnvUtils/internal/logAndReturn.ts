import { verbose } from "../../ConsoleUtils";

/**
 * @internal
 * @private
 * Convenience to consistently log a key/value pair before returning the value.
 * @param key
 * @param value
 * @returns
 */
export function logAndReturn<T>(key: string, value: string | number): T {
	verbose(`Environment Variable: ${key}=${JSON.stringify(value)}`);
	return value as T;
}
