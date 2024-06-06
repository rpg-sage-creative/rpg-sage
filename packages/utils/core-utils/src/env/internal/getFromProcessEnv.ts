/**
 * @internal
 * Looks for an environment variable, as set by PM2 ecosystem files.
 * @param key the key to check
 * @returns
 */
export function getFromProcessEnv(key: string): string | number | undefined {
	if (key in process.env) {
		return process.env[key];
	}
	return undefined;
}