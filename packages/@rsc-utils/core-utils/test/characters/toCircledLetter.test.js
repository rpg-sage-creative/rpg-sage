import { tagLiterals, toCircledLetter } from "../../build/index.js";

describe("characters", () => {
	describe("toCircledLetter", () => {

		const expected = [
			[ 'A', 'ⓐ', 'Ⓐ', '🅐' ],
			[ 'B', 'ⓑ', 'Ⓑ', '🅑' ],
			[ 'C', 'ⓒ', 'Ⓒ', '🅒' ],
			[ 'D', 'ⓓ', 'Ⓓ', '🅓' ],
			[ 'E', 'ⓔ', 'Ⓔ', '🅔' ],
			[ 'F', 'ⓕ', 'Ⓕ', '🅕' ],
			[ 'G', 'ⓖ', 'Ⓖ', '🅖' ],
			[ 'H', 'ⓗ', 'Ⓗ', '🅗' ],
			[ 'I', 'ⓘ', 'Ⓘ', '🅘' ],
			[ 'J', 'ⓙ', 'Ⓙ', '🅙' ],
			[ 'K', 'ⓚ', 'Ⓚ', '🅚' ],
			[ 'L', 'ⓛ', 'Ⓛ', '🅛' ],
			[ 'M', 'ⓜ', 'Ⓜ', '🅜' ],
			[ 'N', 'ⓝ', 'Ⓝ', '🅝' ],
			[ 'O', 'ⓞ', 'Ⓞ', '🅞' ],
			[ 'P', 'ⓟ', 'Ⓟ', '🅟' ],
			[ 'Q', 'ⓠ', 'Ⓠ', '🅠' ],
			[ 'R', 'ⓡ', 'Ⓡ', '🅡' ],
			[ 'S', 'ⓢ', 'Ⓢ', '🅢' ],
			[ 'T', 'ⓣ', 'Ⓣ', '🅣' ],
			[ 'U', 'ⓤ', 'Ⓤ', '🅤' ],
			[ 'V', 'ⓥ', 'Ⓥ', '🅥' ],
			[ 'W', 'ⓦ', 'Ⓦ', '🅦' ],
			[ 'X', 'ⓧ', 'Ⓧ', '🅧' ],
			[ 'Y', 'ⓨ', 'Ⓨ', '🅨' ],
			[ 'Z', 'ⓩ', 'Ⓩ', '🅩' ]
		];

		for (const [letter, lower, upper, negative] of expected) {
			test(tagLiterals`toCircledLetter(${letter.toUpperCase()}) === ${upper}`, () => {
				expect(toCircledLetter(letter.toUpperCase())).toBe(upper);
			});
			test(tagLiterals`toCircledLetter(${letter.toUpperCase()}, { negative:true }) === ${negative}`, () => {
				expect(toCircledLetter(letter.toUpperCase(), { negative:true })).toBe(negative);
			});
			test(tagLiterals`toCircledLetter(${letter.toLowerCase()}) === ${lower}`, () => {
				expect(toCircledLetter(letter.toLowerCase())).toBe(lower);
			});
			test(tagLiterals`toCircledLetter(${letter.toLowerCase()}, { negative:true }) === ""`, () => {
				expect(toCircledLetter(letter.toLowerCase(), { negative:true })).toBe("");
			});
		}

		const errors = [
			"",
			" ",
			"\t",
			"\n",
			"1",
			1,
			true,
			false,
			null,
			undefined,
		];

		for (const value of errors) {
			test(tagLiterals`toCircledLetter(${value}) to throw`, () => {
				expect(() => toCircledLetter(value)).toThrow();
			});
		}

	});
});
