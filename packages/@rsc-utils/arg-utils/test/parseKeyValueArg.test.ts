import { describe, expect, test } from "vitest";
import { parseKeyValueArg } from "../build/index.js";

describe("parseKeyValueArg", () => {

	describe("falsy input", () => {

		test(`parseKeyValueArg(undefined) === undefined`, () => {
			expect(parseKeyValueArg(undefined)).toBe(undefined);
		});

		test(`parseKeyValueArg(null) === undefined`, () => {
			expect(parseKeyValueArg(null)).toBe(undefined);
		});

		test(`parseKeyValueArg("") === undefined`, () => {
			expect(parseKeyValueArg("")).toBe(undefined);
		});

	});

	describe("no value", () => {

		test(`parseKeyValueArg("a=") === undefined`, () => {
			expect(parseKeyValueArg(`a=`)).toBe(undefined);
		});

		test(`parseKeyValueArg("a= ") === undefined (space is not a naked value)`, () => {
			expect(parseKeyValueArg(`a= `)).toBe(undefined);
		});

		test(`parseKeyValueArg("a=\\t") === undefined (tab is not a naked value)`, () => {
			expect(parseKeyValueArg(`a=\t`)).toBe(undefined);
		});

		test(`parseKeyValueArg("a=\\n") === undefined (newline is not a naked value)`, () => {
			expect(parseKeyValueArg(`a=\n`)).toBe(undefined);
		});

		test(`parseKeyValueArg('a= "') === undefined (value starts with whitespace)`, () => {
			expect(parseKeyValueArg(`a= "`)).toBe(undefined);
		});

		test(`parseKeyValueArg('a= b"') === undefined (value starts with whitespace)`, () => {
			expect(parseKeyValueArg(`a= b"`)).toBe(undefined);
		});

		test(`parseKeyValueArg('a= .1') === undefined (value starts with whitespace)`, () => {
			expect(parseKeyValueArg(`a= .1`)).toBe(undefined);
		});

		test(`parseKeyValueArg('a= "''"') === undefined (value starts with whitespace)`, () => {
			expect(parseKeyValueArg(`a= "''"`)).toBe(undefined);
		});

		test(`parseKeyValueArg(a= '""') === undefined (value starts with whitespace)`, () => {
			expect(parseKeyValueArg(`a= '""'`)).toBe(undefined);
		});

	});

	describe("invalid keys", () => {

		test(`parseKeyValueArg("-a1=b") === undefined (leading dash is a FlagArg)`, () => {
			expect(parseKeyValueArg(`-a1=b`)).toBe(undefined);
		});

		test(`parseKeyValueArg(".a1=b") === undefined (leading dot is not allowed)`, () => {
			expect(parseKeyValueArg(`.a1=b`)).toBe(undefined);
		});

		test(`parseKeyValueArg("=0") === undefined (missing key)`, () => {
			expect(parseKeyValueArg(`=0`)).toBe(undefined);
		});

	});

	describe("must match the entire input", () => {

		test(`parseKeyValueArg("a=1 b=2") === undefined (two pairs in one string)`, () => {
			expect(parseKeyValueArg(`a=1 b=2`)).toBe(undefined);
		});

		test(`parseKeyValueArg(" a=1") === undefined (leading whitespace)`, () => {
			expect(parseKeyValueArg(` a=1`)).toBe(undefined);
		});

		test(`parseKeyValueArg('a="b"c') === undefined (trailing junk after a quoted value)`, () => {
			expect(parseKeyValueArg(`a="b"c`)).toBe(undefined);
		});

		test(`parseKeyValueArg("a=b]") === undefined (trailing bracket)`, () => {
			expect(parseKeyValueArg(`a=b]`)).toBe(undefined);
		});

		test(`parseKeyValueArg("a=b}") === undefined (trailing brace)`, () => {
			expect(parseKeyValueArg(`a=b}`)).toBe(undefined);
		});

		test(`parseKeyValueArg("a=[b]") === undefined (brackets are excluded from naked values)`, () => {
			expect(parseKeyValueArg(`a=[b]`)).toBe(undefined);
		});

		test(`parseKeyValueArg("a={b}") === undefined (braces are excluded from naked values)`, () => {
			expect(parseKeyValueArg(`a={b}`)).toBe(undefined);
		});

		test(`parseKeyValueArg('a=\\n\'""\'') === undefined (newline before the value)`, () => {
			expect(parseKeyValueArg(`a=\n'""'`)).toBe(undefined);
		});

		test(`parseKeyValueArg('a=\\t\'""\'') === undefined (tab before the value)`, () => {
			expect(parseKeyValueArg(`a=\t'""'`)).toBe(undefined);
		});

		test(`parseKeyValueArg("a=|||b|||") === undefined (triple pipes leave a trailing pipe)`, () => {
			expect(parseKeyValueArg(`a=|||b|||`)).toBe(undefined);
		});

	});

	describe("naked values", () => {

		test(`parseKeyValueArg("a=b")`, () => {
			expect(parseKeyValueArg(`a=b`)).toEqual({ raw:`a=b`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:"b" });
		});

		test(`parseKeyValueArg("a=1") (numeric string stays a string)`, () => {
			expect(parseKeyValueArg(`a=1`)).toEqual({ raw:`a=1`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:"1" });
		});

		test(`parseKeyValueArg("a=.1") (leading dot)`, () => {
			expect(parseKeyValueArg(`a=.1`)).toEqual({ raw:`a=.1`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:".1" });
		});

		test(`parseKeyValueArg("a=1.0") (decimal)`, () => {
			expect(parseKeyValueArg(`a=1.0`)).toEqual({ raw:`a=1.0`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:"1.0" });
		});

		test(`parseKeyValueArg("a=+2") (leading plus)`, () => {
			expect(parseKeyValueArg(`a=+2`)).toEqual({ raw:`a=+2`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:"+2" });
		});

		test(`parseKeyValueArg("a=-2") (leading minus)`, () => {
			expect(parseKeyValueArg(`a=-2`)).toEqual({ raw:`a=-2`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:"-2" });
		});

		test(`parseKeyValueArg("a=$$%$$%$%$") (special characters)`, () => {
			expect(parseKeyValueArg(`a=$$%$$%$%$`)).toEqual({ raw:`a=$$%$$%$%$`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:"$$%$$%$%$" });
		});

		test(`parseKeyValueArg("a=|b|") (single pipes are naked)`, () => {
			expect(parseKeyValueArg(`a=|b|`)).toEqual({ raw:`a=|b|`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:"|b|" });
		});

		test(`parseKeyValueArg("a=b=c") (value contains an equals sign)`, () => {
			expect(parseKeyValueArg(`a=b=c`)).toEqual({ raw:`a=b=c`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:"b=c" });
		});

		test(`parseKeyValueArg("a==1") (double equals keeps the extra one in the value)`, () => {
			expect(parseKeyValueArg(`a==1`)).toEqual({ raw:`a==1`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:"=1" });
		});

		test(`parseKeyValueArg('a="b') (unterminated quote is swallowed as a naked value)`, () => {
			expect(parseKeyValueArg(`a="b`)).toEqual({ raw:`a="b`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:"\"b" });
		});

	});

	describe("keys", () => {

		test(`parseKeyValueArg("a.1=b") (dotted key)`, () => {
			expect(parseKeyValueArg(`a.1=b`)).toEqual({ raw:`a.1=b`, index:-1, isKeyValue:true, isNaked:true, key:`a.1`, value:"b" });
		});

		test(`parseKeyValueArg("a-1=b") (dashed key)`, () => {
			expect(parseKeyValueArg(`a-1=b`)).toEqual({ raw:`a-1=b`, index:-1, isKeyValue:true, isNaked:true, key:`a-1`, value:"b" });
		});

		test(`parseKeyValueArg("1=2") (digit-only key)`, () => {
			expect(parseKeyValueArg(`1=2`)).toEqual({ raw:`1=2`, index:-1, isKeyValue:true, isNaked:true, key:`1`, value:"2" });
		});

		test(`parseKeyValueArg("café=latte") (unicode key)`, () => {
			expect(parseKeyValueArg(`café=latte`)).toEqual({ raw:`café=latte`, index:-1, isKeyValue:true, isNaked:true, key:`café`, value:"latte" });
		});

		test(`parseKeyValueArg("A=1") (key case is preserved)`, () => {
			expect(parseKeyValueArg(`A=1`)).toEqual({ raw:`A=1`, index:-1, isKeyValue:true, isNaked:true, key:`A`, value:"1" });
		});

	});

	describe("quoted values", () => {

		test(`parseKeyValueArg('a="b"') (double quotes)`, () => {
			expect(parseKeyValueArg(`a="b"`)).toEqual({ raw:`a="b"`, index:-1, isKeyValue:true, key:`a`, value:"b" });
		});

		test(`parseKeyValueArg("a='b'") (single quotes)`, () => {
			expect(parseKeyValueArg(`a='b'`)).toEqual({ raw:`a='b'`, index:-1, isKeyValue:true, key:`a`, value:"b" });
		});

		test(`parseKeyValueArg('a=“b”') (fancy double quotes)`, () => {
			expect(parseKeyValueArg(`a=“b”`)).toEqual({ raw:`a=“b”`, index:-1, isKeyValue:true, key:`a`, value:"b" });
		});

		test(`parseKeyValueArg('a=""') (empty double quotes become null)`, () => {
			expect(parseKeyValueArg(`a=""`)).toEqual({ raw:`a=""`, index:-1, isKeyValue:true, key:`a`, value:null });
		});

		test(`parseKeyValueArg("a=''") (empty single quotes become null)`, () => {
			expect(parseKeyValueArg(`a=''`)).toEqual({ raw:`a=''`, index:-1, isKeyValue:true, key:`a`, value:null });
		});

		test(`parseKeyValueArg('a="$$%$$%$%$"') (special characters in double quotes)`, () => {
			expect(parseKeyValueArg(`a="$$%$$%$%$"`)).toEqual({ raw:`a="$$%$$%$%$"`, index:-1, isKeyValue:true, key:`a`, value:"$$%$$%$%$" });
		});

		test(`parseKeyValueArg(a='$$%$$%$%$') (special characters in single quotes)`, () => {
			expect(parseKeyValueArg(`a='$$%$$%$%$'`)).toEqual({ raw:`a='$$%$$%$%$'`, index:-1, isKeyValue:true, key:`a`, value:"$$%$$%$%$" });
		});

		test(`parseKeyValueArg("escaped double quotes are unescaped")`, () => {
			expect(parseKeyValueArg(`a="b\\"b"`)).toEqual({ raw:`a="b\\"b"`, index:-1, isKeyValue:true, key:`a`, value:"b\"b" });
		});

		test(`parseKeyValueArg("escaped single quotes are unescaped")`, () => {
			expect(parseKeyValueArg(`a='b\\'b'`)).toEqual({ raw:`a='b\\'b'`, index:-1, isKeyValue:true, key:`a`, value:"b'b" });
		});

	});

	describe("misquoted values", () => {

		test(`parseKeyValueArg('a=“b"') (mismatched double quotes are dequoted)`, () => {
			expect(parseKeyValueArg(`a=“b"`)).toEqual({ raw:`a=“b"`, index:-1, isKeyValue:true, key:`a`, value:"b" });
		});

		test(`parseKeyValueArg(a= ‘b') (mismatched single quotes are dequoted)`, () => {
			expect(parseKeyValueArg(`a=‘b'`)).toEqual({ raw:`a=‘b'`, index:-1, isKeyValue:true, key:`a`, value:"b" });
		});

	});

	describe("piped values", () => {

		test(`parseKeyValueArg("a=||1||")`, () => {
			expect(parseKeyValueArg(`a=||1||`)).toEqual({ raw:`a=||1||`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:"||1||" });
		});

		test(`parseKeyValueArg("a=||1 + 2||") (piped values keep internal spaces)`, () => {
			expect(parseKeyValueArg(`a=||1 + 2||`)).toEqual({ raw:`a=||1 + 2||`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:"||1 + 2||" });
		});

		test(`parseKeyValueArg("piped values keep internal newlines")`, () => {
			expect(parseKeyValueArg(`a=||x\ny||`)).toEqual({ raw:`a=||x\ny||`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:"||x\ny||" });
		});

	});

	describe("index", () => {

		test(`parseKeyValueArg("a=1") defaults to index -1`, () => {
			expect(parseKeyValueArg(`a=1`)?.index).toBe(-1);
		});

		test(`parseKeyValueArg("a=1", 0) uses the given index`, () => {
			expect(parseKeyValueArg(`a=1`, 0)?.index).toBe(0);
		});

		test(`parseKeyValueArg("a=1", 3) uses the given index`, () => {
			expect(parseKeyValueArg(`a=1`, 3)?.index).toBe(3);
		});

	});

	describe("keyLower and keyRegex", () => {

		test(`keyLower is the lowercased key`, () => {
			expect(parseKeyValueArg(`A=1`)?.keyLower).toBe("a");
		});

		test(`keyRegex matches the key case-insensitively`, () => {
			const arg = parseKeyValueArg(`A=1`);
			expect(arg?.keyRegex.test(`a`)).toBe(true);
			expect(arg?.keyRegex.test(`A`)).toBe(true);
		});

	});

});
