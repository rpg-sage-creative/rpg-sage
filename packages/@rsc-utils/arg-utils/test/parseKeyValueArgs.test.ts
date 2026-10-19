import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { parseKeyValueArgs } from "../build/index.js";
import { getTests } from "./data.js";

describe("parseKeyValueArgs", () => {

	const tests = getTests("parseKeyValueArgs");
	tests.forEach(({ input, expected }) => {
		test(tagLiterals`parseKeyValueArgs(${input})`, () => {
			expect(parseKeyValueArgs(input)).toEqual(expected);
		});
	});

});
