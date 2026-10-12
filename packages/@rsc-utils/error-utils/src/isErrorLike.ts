/** An object with the expected properties of an Error, but not necessarily a child of the Error class. */
export type ErrorLike<Name extends string = string> = {
	cause?: ErrorLike;
	message: string;
	name: Name;
	stack?: string;
};

/** Confirms that the expected properties of an ErrorLike are of the expected types. */
function checkProperties(err: ErrorLike): boolean {
	return typeof(err.message) === "string"
		&& typeof(err.name) === "string"
		&& (err.cause === undefined || _isErrorLike(err.cause))
		&& (err.stack === undefined || typeof(err.stack) === "string");
}

/** An internal type guard to confirm that the object given is an Error or has the expected properties of an Error. */
function _isErrorLike<
	Name extends string = string
>(
	err: unknown
): err is ErrorLike<Name> {

	if (err) {
		if (err instanceof Error) {
			return true;
		}

		const type = Object.prototype.toString.call(err);
		if (type === "[object Error]" || type === "[object Object]") {
			return checkProperties(err as ErrorLike);
		}
	}
	return false;
}

/** A function used to type guard a known ErrorLike as a specific Error object. */
type ErrorTester<
	Name extends string = string,
	Err extends ErrorLike<Name> = ErrorLike<Name>
> = (err: ErrorLike) => err is Err;

/**
 * Confirms that the given err is a valid ErrorLike.
 * If arg is given, then the ErrorLike will be type guarded accordingly.
 */
export function isErrorLike<
	Name extends string = string
>(
	err: unknown,
	arg?: string | ErrorTester<Name>
): err is ErrorLike<Name> {

	if (_isErrorLike(err)) {

		if (typeof(arg) === "string") {
			return err.message === arg
				|| err.name === arg;
		}

		if (typeof(arg) === "function") {
			return arg(err);
		}

		return true;

	}

	return false;

}
