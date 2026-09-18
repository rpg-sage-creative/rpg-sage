import { warn } from "../loggers/warn.js";

/** Used for catching a Promise. Logs the reason to getLogger().warn and then returns undefined. */
export function warnReturnUndefined<T>(reason: T): undefined {
	warn(reason);
	return undefined;
}
