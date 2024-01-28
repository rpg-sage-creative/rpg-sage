import { parseKeyValueArg } from "@rsc-utils/string-utils";

/**
 * @internal
 * @private
 * Looks for an environment variable, as passed on the command line as: key="value"
 * @param keys the key to check
 * @returns
 */
export function getFromProcessArgv(key: string): string | undefined {
	for (const arg of process.argv) {
		const keyValueArg = parseKeyValueArg(arg, key);
		if (keyValueArg) {
			return keyValueArg.value;
		}
	}
	return undefined;
}