import { parseKeyValueArg } from "../../args/parseKeyValueArg.js";

/**
 * @internal
 * Looks for an environment variable, as passed on the command line as: key="value"
 * @param keys the key to check
 * @returns
 */
export function getFromProcessArgv(key: string): string | undefined {
	for (const arg of process.argv) {
		const pair = parseKeyValueArg(arg, { key });
		if (pair?.value) {
			return pair.value;
		}
	}
	return undefined;
}