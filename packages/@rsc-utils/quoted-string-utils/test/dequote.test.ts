import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { dequote } from "../build/index.js";
import { getTests } from "./data.js";

describe("dequote", () => {

	const tests = getTests("dequote");

	tests.forEach(({ quoted, unquoted }) => {
		test(tagLiterals`dequote(${quoted}) === ${unquoted}`, () => {
			expect(dequote(quoted)).toBe(unquoted);
		});
	});

});
