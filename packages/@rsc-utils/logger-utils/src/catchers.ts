import { error, getLogger, warn } from "./loggers.js";

/** Used for catching a Promise. Logs the reason to getLogger().error and then returns []. */
export function errorReturnEmptyArray<T>(reason: T): [] {
	error(reason);
	return [];
}

/** Used for catching a Promise. Logs the reason to getLogger().error and then returns false. */
export function errorReturnFalse<T>(reason: T): false {
	error(reason);
	return false;
}

/** Used for catching a Promise. Logs the reason to getLogger().error and then returns undefined. */
export function errorReturnUndefined<T>(reason: T): undefined {
	error(reason);
	return undefined;
}

/** Used for catching a Promise. Logs the reason to getLogger().warn and then returns undefined. */
export function warnReturnUndefined<T>(reason: T): undefined {
	warn(reason);
	return undefined;
}

/** Used for catching a Promise. Logs the reason to the given handler and then returns the given returnValue. */
export function createCatcher<T>(handler: "error" | "warn", returnValue: T): (err: any) => T {
	return (err: any) => {
		getLogger()[handler](err);
		return returnValue;
	};
}

/*
export const errorReturnEmptyArray = createCatcher("error", []);
export const errorReturnFalse = createCatcher("error", false);
export const errorReturnUndefined = createCatcher("error", undefined);
export const warnReturnUndefined = createCatcher("warn", undefined);
*/