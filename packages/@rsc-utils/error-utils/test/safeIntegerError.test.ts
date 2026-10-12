import { safeIntegerError } from "../build/index.js";
import { describe, test, expect } from "vitest";

function stringify(args: { argKey:string; value:unknown; min?:number; max?:number; }) {
	const pairs: string[] = [];
	if ("argKey" in args) pairs.push(`argKey:"${args.argKey}"`);
	if ("value" in args) pairs.push(`value:"${typeof(args.value) === "bigint" ? args.value.toString() + "n" : args.value}"`);
	if ("min" in args) pairs.push(`min:"${args.min}"`);
	if ("max" in args) pairs.push(`max:"${args.max}"`);
	return `{ ${pairs.join(", ")} }`;
}
type Args = {
    argKey: string;
    max?: any; // setting this to /number/ causes issues with the safeIntegerError signature due to complete Args type
    min?: number;
    value: unknown;
	error: Function;
};
describe("errors", () => {
	describe("safeIntegerError", () => {
		const tests: Args[] = [
			{ argKey: "count", value: null, error:TypeError, },
			{ argKey: "count", value: undefined, error:TypeError, },
			{ argKey: "count", value: 9, error:RangeError, },
			{ argKey: "count", min:1, value: 9, error:RangeError, },
			{ argKey: "count", max:5, value: 9, error:RangeError, },
			{ argKey: "count", min:1, max:5, value: 9, error:RangeError, },
			{ argKey: "count", value: 9n, error:TypeError, },
			{ argKey: "count", min:1, max:5, value: 9n, error:TypeError, },
			{ argKey: "count", value: "9n", error:TypeError, },
			{ argKey: "count", min:1, max:5, value: "9n", error:TypeError, },
			{ argKey: "count", min:1, max:5, value: null, error:TypeError, },
		];
		tests.map(({ argKey, value, min, max, error }) => {
			test(`safeIntegerError(${stringify({ argKey, value, min, max })} should create a ${error.name})`, () => {
				expect(safeIntegerError({ argKey, value, min, max }).constructor).toBe(error);
			});
		});
	});
});
