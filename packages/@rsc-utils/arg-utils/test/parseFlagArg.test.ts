import { describe, expect, test } from "vitest";
import { parseFlagArg } from "../build/index.js";

describe("parseFlagArg", () => {

	describe("falsy input", () => {

		test(`parseFlagArg(undefined) === undefined`, () => {
			expect(parseFlagArg(undefined)).toBe(undefined);
		});

		test(`parseFlagArg(null) === undefined`, () => {
			expect(parseFlagArg(null)).toBe(undefined);
		});

		test(`parseFlagArg("") === undefined`, () => {
			expect(parseFlagArg("")).toBe(undefined);
		});

	});

	describe("invalid flags", () => {

		test(`parseFlagArg("-") === undefined (dash alone has no key)`, () => {
			expect(parseFlagArg(`-`)).toBe(undefined);
		});

		test(`parseFlagArg("--") === undefined (double dash alone has no key)`, () => {
			expect(parseFlagArg(`--`)).toBe(undefined);
		});

		test(`parseFlagArg("---a") === undefined (three dashes is not a valid prefix)`, () => {
			expect(parseFlagArg(`---a`)).toBe(undefined);
		});

		test(`parseFlagArg("-—a") === undefined (dash and mdash are not interchangeable)`, () => {
			expect(parseFlagArg(`-—a`)).toBe(undefined);
		});

		test(`parseFlagArg("—-a") === undefined (mdash and dash are not interchangeable)`, () => {
			expect(parseFlagArg(`—-a`)).toBe(undefined);
		});

		test(`parseFlagArg("+a") === undefined (plus is not a flag prefix)`, () => {
			expect(parseFlagArg(`+a`)).toBe(undefined);
		});

		test(`parseFlagArg("x-a") === undefined (anchored at index 0)`, () => {
			expect(parseFlagArg(`x-a`)).toBe(undefined);
		});

		test(`parseFlagArg("foo -a") === undefined (flag must be the entire input)`, () => {
			expect(parseFlagArg(`foo -a`)).toBe(undefined);
		});

		test(`parseFlagArg("-a=1") === undefined (KeyValueArg, not FlagArg)`, () => {
			expect(parseFlagArg(`-a=1`)).toBe(undefined);
		});

		test(`parseFlagArg("-abc=") === undefined (trailing junk after the key)`, () => {
			expect(parseFlagArg(`-abc=`)).toBe(undefined);
		});

		test(`parseFlagArg("-a-") === undefined (key cannot end with a dash)`, () => {
			expect(parseFlagArg(`-a-`)).toBe(undefined);
		});

		test(`parseFlagArg("-a--") === undefined (key cannot end with dashes)`, () => {
			expect(parseFlagArg(`-a--`)).toBe(undefined);
		});

		test(`parseFlagArg("-a b") === undefined (whitespace inside the input)`, () => {
			expect(parseFlagArg(`-a b`)).toBe(undefined);
		});

	});

	describe("prefix forms", () => {

		test(`parseFlagArg("-a") (single dash)`, () => {
			expect(parseFlagArg(`-a`)).toEqual({ index:-1, isFlag:true, key:"a", raw:`-a` });
		});

		test(`parseFlagArg("--help") (double dash)`, () => {
			expect(parseFlagArg(`--help`)).toEqual({ index:-1, isFlag:true, key:"help", raw:`--help` });
		});

		test(`parseFlagArg("—a") (mdash autocorrect)`, () => {
			expect(parseFlagArg(`—a`)).toEqual({ index:-1, isFlag:true, key:"a", raw:`—a` });
		});

	});

	describe("keys", () => {

		test(`parseFlagArg("-1") (digit-only key)`, () => {
			expect(parseFlagArg(`-1`)).toEqual({ index:-1, isFlag:true, key:"1", raw:`-1` });
		});

		test(`parseFlagArg("-a.b") (dotted key)`, () => {
			expect(parseFlagArg(`-a.b`)).toEqual({ index:-1, isFlag:true, key:"a.b", raw:`-a.b` });
		});

		test(`parseFlagArg("-hp-5") (dashed key)`, () => {
			expect(parseFlagArg(`-hp-5`)).toEqual({ index:-1, isFlag:true, key:"hp-5", raw:`-hp-5` });
		});

		test(`parseFlagArg("-a--b") (consecutive dashes are allowed within the key)`, () => {
			expect(parseFlagArg(`-a--b`)).toEqual({ index:-1, isFlag:true, key:"a--b", raw:`-a--b` });
		});

		test(`parseFlagArg("--a.b-c") (double dash prefix with a complex key)`, () => {
			expect(parseFlagArg(`--a.b-c`)).toEqual({ index:-1, isFlag:true, key:"a.b-c", raw:`--a.b-c` });
		});

		test(`parseFlagArg("-café") (unicode key)`, () => {
			expect(parseFlagArg(`-café`)).toEqual({ index:-1, isFlag:true, key:"café", raw:`-café` });
		});

		test(`parseFlagArg("—café") (mdash prefix with a unicode key)`, () => {
			expect(parseFlagArg(`—café`)).toEqual({ index:-1, isFlag:true, key:"café", raw:`—café` });
		});

		test(`parseFlagArg("-ABC") (key case is preserved)`, () => {
			expect(parseFlagArg(`-ABC`)).toEqual({ index:-1, isFlag:true, key:"ABC", raw:`-ABC` });
		});

	});

	describe("index", () => {

		test(`parseFlagArg("-a") defaults to index -1`, () => {
			expect(parseFlagArg(`-a`)?.index).toBe(-1);
		});

		test(`parseFlagArg("-a", 0) uses the given index`, () => {
			expect(parseFlagArg(`-a`, 0)?.index).toBe(0);
		});

		test(`parseFlagArg("-a", 2) uses the given index`, () => {
			expect(parseFlagArg(`-a`, 2)?.index).toBe(2);
		});

	});

	describe("flags have no value", () => {

		test(`parseFlagArg("-a") has no value`, () => {
			expect(parseFlagArg(`-a`)?.value).toBe(undefined);
		});

	});

	describe("keyLower and keyRegex", () => {

		test(`keyLower is the lowercased key`, () => {
			expect(parseFlagArg(`-HP`)?.keyLower).toBe("hp");
		});

		test(`keyRegex matches the key case-insensitively`, () => {
			const flag = parseFlagArg(`-HP`);
			expect(flag?.keyRegex.test(`hp`)).toBe(true);
			expect(flag?.keyRegex.test(`HP`)).toBe(true);
		});

	});

});
