import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { alphaToHex } from "../build/internal/toHex.js";

describe("color", () => {
	describe("alphaToHex", () => {
		// Test all values from 0 to 255
		const tests = Array.from({ length: 256 }, (_, i) => ({
			number: i,
			alpha: i / 255,
			hex: i.toString(16).padStart(2, "0")
		}));

		// Test edge cases
		const edgeCases = [
			{ alpha: -0.1, hex: "00" },
			{ alpha: -0.5, hex: "00" },
			{ alpha: 1.1, hex: "ff" },
			{ alpha: 1.5, hex: "ff" },
			{ alpha: 0.5, hex: "80" },
			{ alpha: 0.499, hex: "7f" }
		];

		// Test all values from 0 to 255
		tests.forEach(({ alpha, hex }) => {
			test(tagLiterals`alphaToHex(${alpha}) === ${hex}`, () => {
				expect(alphaToHex(alpha)).toBe(hex);
			});
		});

		// Test edge cases
		edgeCases.forEach(({ alpha, hex }) => {
			test(tagLiterals`alphaToHex(${alpha}) === ${hex}`, () => {
				expect(alphaToHex(alpha)).toBe(hex);
			});
		});

	});
});
