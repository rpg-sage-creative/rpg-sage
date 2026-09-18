type Args = {
	argKey: string;
	mustBe: string;
	value: unknown;
};

/**
 * A reusable TypeError creator.
 * Ex: throw typeError({ argKey:"count", mustBe:"a number", value });
 */
export function typeError(args: Args): TypeError {
	const { argKey, mustBe, value } = args;

	let received: string;

	if (value === null) {
		received = "null";

	}else if (value === undefined) {
		received = "undefined";

	}else {
		const type = typeof(value);

		received = type === "string"
			? `type string ('${value}')`
			: `type ${type} (${value})`;

	}

	const message = `The "${argKey}" argument must be ${mustBe?.trim()}. Received ${received}`;

	const error = new TypeError(message);
	Error.captureStackTrace(error, typeError);
	return error;
}

// export class SageTypeError extends TypeError {
// 	public constructor(args: Args);
// 	public constructor(argKey: string, mustBe: string, value: unknown);
// 	public constructor(argKey: string | Args, mustBe?: string, value?: unknown) {
// 		super(argsToMessage(argKey, mustBe, value));
// 		Error.captureStackTrace(this, SageTypeError);
//     this.name = "SageTypeError";
// 	}
// }