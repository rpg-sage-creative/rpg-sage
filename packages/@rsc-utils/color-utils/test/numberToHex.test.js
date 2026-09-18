import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { numberToHex } from "../build/internal/toHex.js";

describe("color", () => {
	describe("numberToHex", () => {
		// Test all values from 0 to 255
		const tests = Array.from({ length: 256 }, (_, i) => ({
			number: i,
			hex: i.toString(16).padStart(2, "0")
		}));

		// Test edge cases
		const edgeCases = [
			{ number: -1, hex: "00" },
			{ number: -5, hex: "00" },
			{ number: 256, hex: "ff" },
			{ number: 300, hex: "ff" },
			{ number: 127.5, hex: "80" },
			{ number: 128.5, hex: "81" }
		];

		// Test all values from 0 to 255
		tests.forEach(({ number, hex }) => {
			test(tagLiterals`numberToHex(${number}) === ${hex}`, () => {
				expect(numberToHex(number)).toBe(hex);
			});
		});

		// Test edge cases
		edgeCases.forEach(({ number, hex }) => {
			test(tagLiterals`numberToHex(${number}) === ${hex}`, () => {
				expect(numberToHex(number)).toBe(hex);
			});
		});

	});
});
