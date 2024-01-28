/** Logging helper for formatting Error objects. */
export function formatArg(arg: any): string {
	if (arg instanceof Error) {
		if (arg.stack) {
			return arg.stack;
		}
		return arg.message ? `${arg.name}: ${arg.message}` : arg.name;
	}
	return String(arg);
}