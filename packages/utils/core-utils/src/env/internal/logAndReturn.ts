import { verbose } from "../../console/loggers/verbose.js";
import { stringifyJson } from "../../json/stringifyJson.js";

/**
 * @internal
 * Convenience to consistently log a key/value pair before returning the value.
 * @param key
 * @param value
 * @returns
 */
export function logAndReturn<T>(from: "argv" | "env" | "json", key: string, value: string | number): T {
	const outValue = key === "sageToken" ? (value as string).split("").map(() => "*").join("") : value;
	verbose(`Environment Variable (${from}): ${key}=${stringifyJson(outValue)}`);
	return value as T;
}
