import { error } from "../loggers/error.js";
import { warn } from "../loggers/warn.js";

/** Used for catching a Promise. Logs the reason to the given handler and then returns the given returnValue. */
export function createCatcher<T>(handler: typeof error | typeof warn, returnValue: T): (err: any) => T {
	return (err: any) => {
		handler(err);
		return returnValue;
	};
}
