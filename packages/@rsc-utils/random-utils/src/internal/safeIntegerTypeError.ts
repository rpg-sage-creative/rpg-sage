/** Reusable TypeError creator for consistent message of thrown errors. */
export function safeIntegerTypeError(argKey: string, min: number, max: number, value: unknown): TypeError {
	const type = typeof(value);
	const message = `The "${argKey}" argument must be a safe integer between ${min} and ${max} (inclusive). `;
	const received = value === null ? `Received null`
		: value === undefined ? `Received undefined`
		: type === "string" ? `Received type string ('${value}')`
		: `Received type ${type} (${value})`;
	return new TypeError(message + received);
}