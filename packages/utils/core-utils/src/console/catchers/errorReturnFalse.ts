import { error } from "../loggers/error.js";

/** Used for catching a Promise. Logs the reason to getLogger().error and then returns false. */
export function errorReturnFalse<T>(reason: T): false {
	error(reason);
	return false;
}
