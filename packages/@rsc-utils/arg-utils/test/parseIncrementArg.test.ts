import { describe, expect, test } from "vitest";
import { parseIncrementArg } from "../build/index.js";

describe("parseIncrementArg", () => {

	describe("falsy input", () => {

		test(`parseIncrementArg(undefined) === undefined`, () => {
			expect(parseIncrementArg(undefined)).toBe(undefined);
		});

		test(`parseIncrementArg(null) === undefined`, () => {
			expect(parseIncrementArg(null)).toBe(undefined);
		});

		test(`parseIncrementArg("") === undefined`, () => {
			expect(parseIncrementArg("")).toBe(undefined);
		});

	});

	describe("not increment args", () => {

		test(`parseIncrementArg("a") === undefined (key alone is not an increment)`, () => {
			expect(parseIncrementArg(`a`)).toBe(undefined);
		});

		test(`parseIncrementArg("a=") === undefined (KeyValueArg, not IncrementArg)`, () => {
			expect(parseIncrementArg(`a=`)).toBe(undefined);
		});

		test(`parseIncrementArg("a=b") === undefined (KeyValueArg, not IncrementArg)`, () => {
			expect(parseIncrementArg(`a=b`)).toBe(undefined);
		});

		test(`parseIncrementArg("a+") === undefined (single plus is not an increment)`, () => {
			expect(parseIncrementArg(`a+`)).toBe(undefined);
		});

		test(`parseIncrementArg("a-") === undefined (single dash is not a decrement)`, () => {
			expect(parseIncrementArg(`a-`)).toBe(undefined);
		});

		test(`parseIncrementArg("++") === undefined (missing key)`, () => {
			expect(parseIncrementArg(`++`)).toBe(undefined);
		});

		test(`parseIncrementArg(" a++") === undefined (leading whitespace)`, () => {
			expect(parseIncrementArg(` a++`)).toBe(undefined);
		});

		test(`parseIncrementArg("-a++") === undefined (anchored at index 0, leading dash fails)`, () => {
			expect(parseIncrementArg(`-a++`)).toBe(undefined);
		});

	});

	describe("must match the entire input", () => {

		test(`parseIncrementArg("a++x") === undefined (trailing junk after ++)`, () => {
			expect(parseIncrementArg(`a++x`)).toBe(undefined);
		});

		test(`parseIncrementArg("a+++") === undefined (third plus is trailing junk)`, () => {
			expect(parseIncrementArg(`a+++`)).toBe(undefined);
		});

		test(`parseIncrementArg("a--x") === undefined (trailing junk after --)`, () => {
			expect(parseIncrementArg(`a--x`)).toBe(undefined);
		});

		test(`parseIncrementArg("a—5") === undefined (mdash takes no value)`, () => {
			expect(parseIncrementArg(`a—5`)).toBe(undefined);
		});

		test(`parseIncrementArg("a-—") === undefined (dash and mdash are not interchangeable)`, () => {
			expect(parseIncrementArg(`a-—`)).toBe(undefined);
		});

	});

	describe("increment/decrement shorthand", () => {

		test(`parseIncrementArg("a++") defaults to a value of 1`, () => {
			expect(parseIncrementArg(`a++`)).toEqual({ index:-1, isIncrement:true, key:"a", operator:"+", value:1, raw:`a++` });
		});

		test(`parseIncrementArg("a--") defaults to a value of 1`, () => {
			expect(parseIncrementArg(`a--`)).toEqual({ index:-1, isIncrement:true, key:"a", operator:"-", value:1, raw:`a--` });
		});

		test(`parseIncrementArg("a—") (mdash autocorrect) defaults to a value of 1`, () => {
			expect(parseIncrementArg(`a—`)).toEqual({ index:-1, isIncrement:true, key:"a", operator:"-", value:1, raw:`a—` });
		});

	});

	describe("explicit values", () => {

		test(`parseIncrementArg("a+=1")`, () => {
			expect(parseIncrementArg(`a+=1`)).toEqual({ index:-1, isIncrement:true, key:"a", operator:"+", value:1, raw:`a+=1` });
		});

		test(`parseIncrementArg("a-=1")`, () => {
			expect(parseIncrementArg(`a-=1`)).toEqual({ index:-1, isIncrement:true, key:"a", operator:"-", value:1, raw:`a-=1` });
		});

		test(`parseIncrementArg("a+=0") (zero is a valid value)`, () => {
			expect(parseIncrementArg(`a+=0`)).toEqual({ index:-1, isIncrement:true, key:"a", operator:"+", value:0, raw:`a+=0` });
		});

		test(`parseIncrementArg("a+=1.5") (decimal)`, () => {
			expect(parseIncrementArg(`a+=1.5`)).toEqual({ index:-1, isIncrement:true, key:"a", operator:"+", value:1.5, raw:`a+=1.5` });
		});

		test(`parseIncrementArg("a-=-2") (negative value)`, () => {
			expect(parseIncrementArg(`a-=-2`)).toEqual({ index:-1, isIncrement:true, key:"a", operator:"-", value:-2, raw:`a-=-2` });
		});

		test(`parseIncrementArg("a+=+2") (leading plus)`, () => {
			expect(parseIncrementArg(`a+=+2`)).toEqual({ index:-1, isIncrement:true, key:"a", operator:"+", value:2, raw:`a+=+2` });
		});

		test(`parseIncrementArg("a+=01") (leading zero)`, () => {
			expect(parseIncrementArg(`a+=01`)).toEqual({ index:-1, isIncrement:true, key:"a", operator:"+", value:1, raw:`a+=01` });
		});

	});

	describe("invalid values", () => {

		test(`parseIncrementArg("a+=") === undefined (missing value)`, () => {
			expect(parseIncrementArg(`a+=`)).toBe(undefined);
		});

		test(`parseIncrementArg('a+="b"') === undefined (quoted non-number)`, () => {
			expect(parseIncrementArg(`a+="b"`)).toBe(undefined);
		});

		test(`parseIncrementArg('a-="b"') === undefined (quoted non-number)`, () => {
			expect(parseIncrementArg(`a-="b"`)).toBe(undefined);
		});

		test(`parseIncrementArg('a+=""') === undefined (empty quoted value)`, () => {
			expect(parseIncrementArg(`a+=""`)).toBe(undefined);
		});

		test(`parseIncrementArg("a+=.5") === undefined (numbers need a leading digit)`, () => {
			expect(parseIncrementArg(`a+=.5`)).toBe(undefined);
		});

		test(`parseIncrementArg("a+=1e3") === undefined (exponents are not supported)`, () => {
			expect(parseIncrementArg(`a+=1e3`)).toBe(undefined);
		});

	});

	describe("quoted values", () => {

		test(`parseIncrementArg('a+="2"')`, () => {
			expect(parseIncrementArg(`a+="2"`)).toEqual({ index:-1, isIncrement:true, key:"a", operator:"+", value:2, raw:`a+="2"` });
		});

		test(`parseIncrementArg("a+=' 3 '") (spaces inside quotes are trimmed)`, () => {
			expect(parseIncrementArg(`a+=' 3 '`)).toEqual({ index:-1, isIncrement:true, key:"a", operator:"+", value:3, raw:`a+=' 3 '` });
		});

		test(`parseIncrementArg('a+=“4”') (fancy double quotes)`, () => {
			expect(parseIncrementArg(`a+=“4”`)).toEqual({ index:-1, isIncrement:true, key:"a", operator:"+", value:4, raw:`a+=“4”` });
		});

		test(`parseIncrementArg('a+=“5"') (mismatched double quotes)`, () => {
			expect(parseIncrementArg(`a+=“5"`)).toEqual({ index:-1, isIncrement:true, key:"a", operator:"+", value:5, raw:`a+=“5"` });
		});

		test(`parseIncrementArg(a+= ‘6') (mismatched single quotes)`, () => {
			expect(parseIncrementArg(`a+=‘6'`)).toEqual({ index:-1, isIncrement:true, key:"a", operator:"+", value:6, raw:`a+=‘6'` });
		});

	});

	describe("keys", () => {

		test(`parseIncrementArg("a.1+=2") (dotted key)`, () => {
			expect(parseIncrementArg(`a.1+=2`)).toEqual({ index:-1, isIncrement:true, key:"a.1", operator:"+", value:2, raw:`a.1+=2` });
		});

		test(`parseIncrementArg("hp-5--") (dashed key)`, () => {
			expect(parseIncrementArg(`hp-5--`)).toEqual({ index:-1, isIncrement:true, key:"hp-5", operator:"-", value:1, raw:`hp-5--` });
		});

		test(`parseIncrementArg("1++") (digit-only key)`, () => {
			expect(parseIncrementArg(`1++`)).toEqual({ index:-1, isIncrement:true, key:"1", operator:"+", value:1, raw:`1++` });
		});

		test(`parseIncrementArg("café++") (unicode key)`, () => {
			expect(parseIncrementArg(`café++`)).toEqual({ index:-1, isIncrement:true, key:"café", operator:"+", value:1, raw:`café++` });
		});

		test(`parseIncrementArg("HP+=3") (key case is preserved)`, () => {
			expect(parseIncrementArg(`HP+=3`)).toEqual({ index:-1, isIncrement:true, key:"HP", operator:"+", value:3, raw:`HP+=3` });
		});

	});

	describe("index", () => {

		test(`parseIncrementArg("a++") defaults to index -1`, () => {
			expect(parseIncrementArg(`a++`)?.index).toBe(-1);
		});

		test(`parseIncrementArg("a++", 0) uses the given index`, () => {
			expect(parseIncrementArg(`a++`, 0)?.index).toBe(0);
		});

		test(`parseIncrementArg("a++", 2) uses the given index`, () => {
			expect(parseIncrementArg(`a++`, 2)?.index).toBe(2);
		});

	});

	describe("keyLower and keyRegex", () => {

		test(`keyLower is the lowercased key`, () => {
			expect(parseIncrementArg(`HP++`)?.keyLower).toBe("hp");
		});

		test(`keyRegex matches the key case-insensitively`, () => {
			const arg = parseIncrementArg(`HP++`);
			expect(arg?.keyRegex.test(`hp`)).toBe(true);
			expect(arg?.keyRegex.test(`HP`)).toBe(true);
		});

	});

});
