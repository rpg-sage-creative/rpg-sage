import { error } from "../loggers/error.js";

/** Used for catching a Promise. Logs the reason to getLogger().error and then returns []. */
export function errorReturnEmptyArray<T>(reason: T): [] {
	error(reason);
	return [];
}
