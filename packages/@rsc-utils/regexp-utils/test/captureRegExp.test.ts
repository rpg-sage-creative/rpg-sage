import { describe, expect, test } from "vitest";
import { captureRegExp } from "../build/index.js";

describe("regex", () => {

	describe("captureRegExp", () => {

		test(`wraps the source in a named capture group`, () => {
			expect(captureRegExp(/\d+/, `num`).source).toBe(`(?<num>\\d+)`);
		});

		test(`keeps the flags of the given regexp`, () => {
			expect(captureRegExp(/a/i, `letter`).flags).toBe(`i`);
			expect(captureRegExp(/a/g, `letter`).flags).toBe(`g`);
		});

		test(`returns a new instance`, () => {
			const regexp = /a/;
			expect(captureRegExp(regexp, `letter`)).not.toBe(regexp);
			expect(captureRegExp(regexp, `letter`)).not.toBe(captureRegExp(regexp, `letter`));
		});

		test(`exposes the match via groups`, () => {
			const regexp = captureRegExp(/\d+/, `num`);
			expect(regexp.exec(`nothing 12 here`)?.groups?.num).toBe(`12`);
			expect(regexp.exec(`nothing`)).toBeNull();
		});

		test(`contains top-level alternation inside the group`, () => {
			const regexp = captureRegExp(/a|b/, `letter`);
			expect(regexp.source).toBe(`(?<letter>a|b)`);
			expect(regexp.exec(`zzab`)?.groups?.letter).toBe(`a`);
		});

		test(`preserves existing named groups alongside the new one`, () => {
			const regexp = captureRegExp(/(?<inner>\d+)/, `outer`);
			const match = regexp.exec(`v12`)?.groups;
			expect(match?.outer).toBe(`12`);
			expect(match?.inner).toBe(`12`);
		});

		test(`throws for an invalid capture name`, () => {
			expect(() => captureRegExp(/a/, `1bad`)).toThrow(SyntaxError);
		});

	});

});
