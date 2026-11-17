import { describe, expect, test } from "vitest";
import { getSubscriptCharSet } from "../build/index.js";

describe("getSubscriptCharSet", () => {

	test(`returns the same memoized object on every call`, () => {
		expect(getSubscriptCharSet()).toBe(getSubscriptCharSet());
	});

	test(`type is "sub"`, () => {
		expect(getSubscriptCharSet().type).toBe("sub");
	});

	test(`numbers holds the ten subscript digits in order`, () => {
		expect(getSubscriptCharSet().numbers).toStrictEqual(["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"]);
	});

	test(`math chars are the subscript block`, () => {
		const set = getSubscriptCharSet();
		expect(set.equals).toBe(`₌`);
		expect(set.minus).toBe(`₋`);
		expect(set.plus).toBe(`₊`);
		expect(set.parentheses).toStrictEqual(["₍", "₎"]);
	});

	test(`period is U+2024 ONE DOT LEADER, not an ASCII period (quirk)`, () => {
		expect(getSubscriptCharSet().period.codePointAt(0)).toBe(0x2024);
	});

	describe("numberRegex matches scripted numbers only", () => {

		test(`matches plain digits: ₁₂₃`, () => {
			expect(getSubscriptCharSet().numberRegex.test(`₁₂₃`)).toBe(true);
		});

		test(`matches signed values: ₊₁₂ and ₋₅`, () => {
			expect(getSubscriptCharSet().numberRegex.test(`₊₁₂`)).toBe(true);
			expect(getSubscriptCharSet().numberRegex.test(`₋₅`)).toBe(true);
		});

		test(`matches its own period char: ₁․₂`, () => {
			expect(getSubscriptCharSet().numberRegex.test(`₁․₂`)).toBe(true);
		});

		test(`rejects plain ASCII digits`, () => {
			expect(getSubscriptCharSet().numberRegex.test(`123`)).toBe(false);
		});

		test(`rejects an ASCII period inside scripted digits`, () => {
			expect(getSubscriptCharSet().numberRegex.test(`₁.₂`)).toBe(false);
		});

		test(`anchored — rejects embedded matches like x₁₂x`, () => {
			expect(getSubscriptCharSet().numberRegex.test(`x₁₂x`)).toBe(false);
		});

	});

});
