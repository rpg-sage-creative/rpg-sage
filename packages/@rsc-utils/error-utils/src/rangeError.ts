type Args = {
	argKey: string;
	mustBe: string;
	value: unknown;
};

/**
 * A reusable RangeError creator.
 * Ex: throw rangeError({ argKey:"count", mustBe:"a safe integer greater than 0", value });
 */
export function rangeError(args: Args): RangeError {
	const { argKey, mustBe, value } = args;

	const type = typeof(value);

	const received = type === "string"
		? `'${value}'`
		: value;

	const message = `The "${argKey}" argument must be ${mustBe.trim()}. Received ${received}`;

	const error = new RangeError(message);
	Error.captureStackTrace(error, rangeError);
	return error;
}