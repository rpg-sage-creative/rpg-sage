import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { unwrap } from "../../build/index.js";
import { getTests } from "./data.mjs";

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
