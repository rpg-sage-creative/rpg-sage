import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { wrap } from "../../build/index.js";
import { getTests } from "./data.mjs";

describe("wrap", () => {
	describe("wrap", () => {

		const tests = getTests();

		tests.forEach(({ unwrapped, chars, wrapped }) => {

			test(tagLiterals`wrap(${unwrapped}, ${chars}) === ${wrapped}`, () => {
				expect(wrap(unwrapped, chars)).toBe(wrapped);
			});

		});

	});
});
