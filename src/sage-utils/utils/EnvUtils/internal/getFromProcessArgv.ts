import { dequote } from "../../StringUtils";

/**
 * @internal
 * @private
 * Looks for an environment variable, as passed on the command line as: key="value"
 * @param keys the key to check
 * @returns
 */
export function getFromProcessArgv(key: string): string | undefined {
	const arg = process.argv.find(arg => arg.startsWith(`${key}=`));
	if (arg) {
		return dequote(arg.split("=")[1]);
	}
	return undefined;
}