import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { toSuperscript } from "../build/index.js";

describe("toSuperscript", () => {
	const tests: [number|bigint,string][] = [
		[12345678.09, "¹²³⁴⁵⁶⁷⁸\u22C5⁰⁹"],
		[-12345678.09, "⁻¹²³⁴⁵⁶⁷⁸\u22C5⁰⁹"],
		[12345678123456709n, "¹²³⁴⁵⁶⁷⁸¹²³⁴⁵⁶⁷⁰⁹"],
		[-12345678123456709n, "⁻¹²³⁴⁵⁶⁷⁸¹²³⁴⁵⁶⁷⁰⁹"],
	];

	tests.forEach(([input, output]) => {
		test(tagLiterals`toSuperscript(${input}) === ${output}`, () => {
			expect(toSuperscript(input)).toBe(output);
		});
	});
});

