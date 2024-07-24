
function parseKeyValueArg(input: string, key: string): string | undefined {
	const regex = new RegExp(`^${key}=("[^"]+"|'[^']+'|\\S+)$`, "i");
	if (regex.test(input)) {
		const value = input.slice(input.indexOf("=") + 1);
		if (/^("[^"]+"|'[^']+')$/.test(value)) {
			return value.slice(1, -1).trim();
		}
		return value;
	}
	return undefined;
}

/**
 * @internal
 * Looks for an environment variable, as passed on the command line as: key="value"
 * @param keys the key to check
 * @returns
 */
export function getFromProcessArgv(key: string): string | undefined {
	for (const arg of process.argv) {
		const value = parseKeyValueArg(arg, key);
		if (value) {
			return value;
		}
	}
	return undefined;
}