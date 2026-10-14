import { Logger } from "./Logger.js";

/**
 * Used for catching a Promise.
 * Logs the reason to getLogger().error and then returns [].
 * Triggers Logger.init() only on the first use.
 */
export function errorReturnEmptyArray<T>(reason: T): [] {
	return Logger.instance.errorReturnEmptyArray(reason) as [];
}

/**
 * Used for catching a Promise.
 * Logs the reason to getLogger().error and then returns false.
 * Triggers Logger.init() only on the first use.
 */
export function errorReturnFalse<T>(reason: T): false {
	return Logger.instance.errorReturnFalse(reason);
}

/**
 * Used for catching a Promise.
 * Logs the reason to getLogger().error and then returns undefined.
 * Triggers Logger.init() only on the first use.
 */
export function errorReturnUndefined<T>(reason: T): undefined {
	return Logger.instance.errorReturnUndefined(reason);
}

/**
 * Used for catching a Promise.
 * Logs the reason to getLogger().warn and then returns undefined.
 * Triggers Logger.init() only on the first use.
 */
export function warnReturnUndefined<T>(reason: T): undefined {
	return Logger.instance.warnReturnUndefined(reason);
}
