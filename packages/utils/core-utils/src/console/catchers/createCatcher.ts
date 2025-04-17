import { getLogger } from "../loggers/getLogger.js";

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
export const errorReturnNull = createCatcher("error", null);
export const errorReturnUndefined = createCatcher("error", undefined);
export const warnReturnNull = createCatcher("warn", null);
export const warnReturnUndefined = createCatcher("warn", undefined);
*/