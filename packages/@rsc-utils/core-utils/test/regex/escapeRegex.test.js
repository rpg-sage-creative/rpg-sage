import { escapeRegex, tagLiterals } from "../../build/index.js";

/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape
*/

describe("regex", () => {
	describe("escapeRegex", () => {

		"01234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(char => {
			const escaped = `\\x${char.charCodeAt(0).toString(16)}`;
			test(tagLiterals`escapeChar(${char}) === ${escaped}`, () => {
				expect(escapeRegex(char)).toBe(escaped);
			});
			const pair = `?${char}`;
			const notEscaped = `\\?${char}`;
			test(tagLiterals`escapeChar(${pair}) === ${notEscaped}`, () => {
				expect(escapeRegex(pair)).toBe(notEscaped);
			});
		});

		"^$\\.*+?()[]{}|/".split("").forEach(char => {
			const escaped = `\\${char}`;
			test(tagLiterals`escapeChar(${char}) === ${escaped}`, () => {
				expect(escapeRegex(char)).toBe(escaped);
			});
		});

		",-=<>#&!%:;@~'`\" ".split("").forEach(char => {
			const escaped = `\\x${char.charCodeAt(0).toString(16)}`;
			test(tagLiterals`escapeChar(${char}) === ${escaped}`, () => {
				expect(escapeRegex(char)).toBe(escaped);
			});
		});

		[
			{ char:"\f", escaped:"\\f" },
			{ char:"\n", escaped:"\\n" },
			{ char:"\r", escaped:"\\r" },
			{ char:"\t", escaped:"\\t" },
			{ char:"\v", escaped:"\\v" },
		].forEach(({ char, escaped }) => {
			test(tagLiterals`escapeChar(${char}) === ${escaped}`, () => {
				expect(escapeRegex(char)).toBe(escaped);
			})
		});
	});
});
