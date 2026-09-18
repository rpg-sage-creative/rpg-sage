import { stringifyJson } from "@rsc-utils/json-utils";
import { verbose } from "../../console/loggers/verbose.js";
import type { ValidatorArg } from "../types.js";

/**
 * @internal
 * Convenience to consistently log a key/value pair before returning the value.
 * @param key
 * @param value
 * @returns
 */
export function logAndReturn<T>(from: "argv" | "env" | "json", key: string, value: ValidatorArg): T {
	const shouldMask = key.endsWith("Token") || key.includes("AccessKey");
	const outValue = shouldMask ? (value as string).split("").map(() => "*").join("") : value;
	verbose(`Environment Variable (${from}): ${key}=${stringifyJson(outValue)}`);
	return value as T;
}
