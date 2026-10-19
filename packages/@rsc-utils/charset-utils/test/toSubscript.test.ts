import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { toSubscript } from "../build/index.js";


describe("toSubscript", () => {

	const tests: [number|bigint,string][] = [
		[12345678.09, "₁₂₃₄₅₆₇₈\u2024₀₉"],
		[-12345678.09, "₋₁₂₃₄₅₆₇₈\u2024₀₉"],
		[12345678123456709n, "₁₂₃₄₅₆₇₈₁₂₃₄₅₆₇₀₉"],
		[-12345678123456709n, "₋₁₂₃₄₅₆₇₈₁₂₃₄₅₆₇₀₉"],
	];

	tests.forEach(([input, output]) => {
		test(tagLiterals`toSubscript(${input}) === ${output}`, () => {
			expect(toSubscript(input)).toBe(output);
		});
	});

});
