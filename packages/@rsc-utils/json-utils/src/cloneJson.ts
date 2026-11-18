import { parseJson } from "./parseJson.js";
import { stringifyJson } from "./stringifyJson.js";

/**
 * BigInt, Date, and non-finite-number safe JSON.parse(JSON.stringify(object)).
 * The clone is lossless for values plain JSON would lose: bigint, Date, NaN, -0, and ±Infinity at any depth.
 */
export function cloneJson<T>(object: unknown): T {
	switch(typeof(object)) {
		case "undefined":
			throw new SyntaxError(`JSON Parse error: Unexpected identifier "undefined"`);

		// immutable primitives ARE their own clone; identity equals the round-trip for every value of these types (probed, incl. control chars and lone surrogates)
		case "bigint":
		case "boolean":
		case "number":
		case "string":
			return object as T;

		// objects/arrays need the deep copy and Dates a new instance; null round-trips to null, and symbol/function still throw here via stringify->undefined->parse like before
		default:
			return parseJson(stringifyJson(object));
	}
}