import { tagLiterals, unwrap } from "../../../build/index.js";
import { getTests } from "./data.js";

describe("string", () => {
	describe("wrap", () => {
		describe("unwrap", () => {

			const tests = getTests();
			tests.forEach(({ unwrapped, chars, wrapped }) => {
				test(tagLiterals`unwrap(${wrapped}, ${chars}) === ${unwrapped}`, () => {
					expect(unwrap(wrapped, chars)).toBe(unwrapped);
				})
			});

		});
	});
});
