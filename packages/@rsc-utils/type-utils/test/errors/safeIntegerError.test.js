import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { safeIntegerError } from "../../build/index.js";

describe("errors", () => {
	describe("safeIntegerError", () => {
		const tests = [
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
			test(tagLiterals`safeIntegerError(${({ argKey, value, min, max })} should create a ${error.name})`, () => {
				expect(safeIntegerError({ argKey, value, min, max }).constructor).toBe(error);
			});
		});
	});
});
