import { error } from "../loggers/error.js";

/** Used for catching a Promise. Logs the reason to getLogger().error and then returns null. */
export function errorReturnNull<T>(reason: T): null {
	error(reason);
	return null;
}
