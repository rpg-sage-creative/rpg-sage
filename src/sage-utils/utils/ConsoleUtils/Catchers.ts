import { error, warn } from "./logger";

/** Used for catching a Promise. Logs the reason to console.error and then returns false. */
export function errorReturnFalse<T = any>(reason: T): false {
	error(reason);
	return false;
}

/** Used for catching a Promise. Logs the reason to console.error and then returns null. */
export function errorReturnNull<T = any>(reason: T): null {
	error(reason);
	return null;
}

/** Used for catching a Promise. Logs the reason to console.error and then returns []. */
export function errorReturnEmptyArray<T = any>(reason: T): any[] {
	error(reason);
	return [];
}

/** Used for catching a Promise. Logs the reason to console.warn and then returns null. */
export function warnReturnNull<T = any>(reason: T): null {
	warn(reason);
	return null;
}
