import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { parseIncrementArg } from "../build/index.js";
import { getTests } from "./data.js";

describe("parseIncrementArg", () => {

	const tests = getTests("parseIncrementArg");
	tests.forEach(({ input, expected }) => {
		test(tagLiterals`parseIncrementArg(${input})`, () => {
			expect(parseIncrementArg(input)).toEqual(expected);
		});
	});

});
