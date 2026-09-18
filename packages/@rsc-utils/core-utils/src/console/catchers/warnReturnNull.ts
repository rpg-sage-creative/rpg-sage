import { warn } from "../loggers/warn.js";

/**
 * Used for catching a Promise. Logs the reason to getLogger().warn and then returns null.
 * @deprecated Stop using null, use warnReturnUndefined()
 */
export function warnReturnNull<T>(reason: T): null {
	warn(reason);
	return null;
}
