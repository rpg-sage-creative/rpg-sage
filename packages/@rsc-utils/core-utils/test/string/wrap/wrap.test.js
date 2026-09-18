import { tagLiterals, wrap } from "../../../build/index.js";
import { getTests } from "./data.js";

describe("string", () => {
	describe("wrap", () => {
		describe("wrap", () => {

			const tests = getTests();
			tests.forEach(({ unwrapped, chars, wrapped }) => {
				test(tagLiterals`wrap(${unwrapped}, ${chars}) === ${wrapped}`, () => {
					expect(wrap(unwrapped, chars)).toBe(wrapped);
				})
			});

		});
	});
});
