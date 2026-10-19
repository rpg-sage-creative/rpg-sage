import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { parseKeyValueArg } from "../build/index.js";
import { getTests } from "./data.js";

describe("parseKeyValueArg", () => {

	const tests = getTests("parseKeyValueArg");
	tests.forEach(({ input, expected }) => {
		test(tagLiterals`parseKeyValueArg(${input})`, () => {
			expect(parseKeyValueArg(input)).toEqual(expected);
		});
	});

});
