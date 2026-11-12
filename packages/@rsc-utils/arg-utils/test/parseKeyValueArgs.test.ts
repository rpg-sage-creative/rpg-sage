import { describe, expect, test } from "vitest";
import { parseKeyValueArgs } from "../build/index.js";

describe("parseKeyValueArgs", () => {

	describe("empty input", () => {

		test(`parseKeyValueArgs(undefined) === []`, () => {
			expect(parseKeyValueArgs(undefined)).toEqual([]);
		});

		test(`parseKeyValueArgs(null) === []`, () => {
			expect(parseKeyValueArgs(null)).toEqual([]);
		});

		test(`parseKeyValueArgs("") === []`, () => {
			expect(parseKeyValueArgs("")).toEqual([]);
		});

		test(`parseKeyValueArgs(whitespace only) === []`, () => {
			expect(parseKeyValueArgs(`   \n\t `)).toEqual([]);
		});

	});

	describe("no key/value pairs", () => {

		test(`parseKeyValueArgs("hello world") === []`, () => {
			expect(parseKeyValueArgs(`hello world`)).toEqual([]);
		});

		test(`parseKeyValueArgs("[macroName]") === []`, () => {
			expect(parseKeyValueArgs(`[macroName]`)).toEqual([]);
		});

		test(`parseKeyValueArgs("=0") === []`, () => {
			expect(parseKeyValueArgs(`=0`)).toEqual([]);
		});

		test(`parseKeyValueArgs("arg=") === []`, () => {
			expect(parseKeyValueArgs(`arg=`)).toEqual([]);
		});

		test(`parseKeyValueArgs("arg-=0") === [] (trailing dash is not a valid key)`, () => {
			expect(parseKeyValueArgs(`arg-=0`)).toEqual([]);
		});

		test(`parseKeyValueArgs("arg={a}") === [] (braces are excluded from naked values)`, () => {
			expect(parseKeyValueArgs(`arg={a}`)).toEqual([]);
		});

	});

	describe("naked values", () => {

		test(`parseKeyValueArgs("arg1=0")`, () => {
			expect(parseKeyValueArgs(`arg1=0`)).toEqual([
				{ raw:`arg1=0`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"0" },
			]);
		});

		test(`parseKeyValueArgs("arg.1=0") (dotted key)`, () => {
			expect(parseKeyValueArgs(`arg.1=0`)).toEqual([
				{ raw:`arg.1=0`, index:-1, isKeyValue:true, isNaked:true, key:`arg.1`, value:"0" },
			]);
		});

		test(`parseKeyValueArgs("arg-1=0") (dashed key)`, () => {
			expect(parseKeyValueArgs(`arg-1=0`)).toEqual([
				{ raw:`arg-1=0`, index:-1, isKeyValue:true, isNaked:true, key:`arg-1`, value:"0" },
			]);
		});

		test(`parseKeyValueArgs("1=2") (digit-only key)`, () => {
			expect(parseKeyValueArgs(`1=2`)).toEqual([
				{ raw:`1=2`, index:-1, isKeyValue:true, isNaked:true, key:`1`, value:"2" },
			]);
		});

		test(`parseKeyValueArgs("café=latte") (unicode key)`, () => {
			expect(parseKeyValueArgs(`café=latte`)).toEqual([
				{ raw:`café=latte`, index:-1, isKeyValue:true, isNaked:true, key:`café`, value:"latte" },
			]);
		});

		test(`parseKeyValueArgs("arg=-1") (negative number)`, () => {
			expect(parseKeyValueArgs(`arg=-1`)).toEqual([
				{ raw:`arg=-1`, index:-1, isKeyValue:true, isNaked:true, key:`arg`, value:"-1" },
			]);
		});

		test(`parseKeyValueArgs("arg=a=b") (value contains an equals sign)`, () => {
			expect(parseKeyValueArgs(`arg=a=b`)).toEqual([
				{ raw:`arg=a=b`, index:-1, isKeyValue:true, isNaked:true, key:`arg`, value:"a=b" },
			]);
		});

		test(`parseKeyValueArgs("arg==0") (double equals keeps the extra one in the value)`, () => {
			expect(parseKeyValueArgs(`arg==0`)).toEqual([
				{ raw:`arg==0`, index:-1, isKeyValue:true, isNaked:true, key:`arg`, value:"=0" },
			]);
		});

		test(`parseKeyValueArgs("a r=g") (key cannot contain whitespace)`, () => {
			expect(parseKeyValueArgs(`a r=g`)).toEqual([
				{ raw:`r=g`, index:-1, isKeyValue:true, isNaked:true, key:`r`, value:"g" },
			]);
		});

		test(`parseKeyValueArgs("-arg=0") (leading dash is skipped, match starts at the key)`, () => {
			expect(parseKeyValueArgs(`-arg=0`)).toEqual([
				{ raw:`arg=0`, index:-1, isKeyValue:true, isNaked:true, key:`arg`, value:"0" },
			]);
		});

		test(`parseKeyValueArgs('arg="blah') (unterminated quote is swallowed as a naked value)`, () => {
			expect(parseKeyValueArgs(`arg="blah`)).toEqual([
				{ raw:`arg="blah`, index:-1, isKeyValue:true, isNaked:true, key:`arg`, value:"\"blah" },
			]);
		});

		test(`parseKeyValueArgs("arg=|a|") (single pipes are naked)`, () => {
			expect(parseKeyValueArgs(`arg=|a|`)).toEqual([
				{ raw:`arg=|a|`, index:-1, isKeyValue:true, isNaked:true, key:`arg`, value:"|a|" },
			]);
		});

	});

	describe("quoted values", () => {

		test(`parseKeyValueArgs('arg2="blah"')`, () => {
			expect(parseKeyValueArgs(`arg2="blah"`)).toEqual([
				{ raw:`arg2="blah"`, index:-1, isKeyValue:true, key:`arg2`, value:"blah" },
			]);
		});

		test(`parseKeyValueArgs("arg='blah'") (single quotes)`, () => {
			expect(parseKeyValueArgs(`arg='blah'`)).toEqual([
				{ raw:`arg='blah'`, index:-1, isKeyValue:true, key:`arg`, value:"blah" },
			]);
		});

		test(`parseKeyValueArgs("arg=“blah”") (fancy double quotes)`, () => {
			expect(parseKeyValueArgs(`arg=“blah”`)).toEqual([
				{ raw:`arg=“blah”`, index:-1, isKeyValue:true, key:`arg`, value:"blah" },
			]);
		});

		test(`parseKeyValueArgs('arg=""') (empty double quotes become null)`, () => {
			expect(parseKeyValueArgs(`arg=""`)).toEqual([
				{ raw:`arg=""`, index:-1, isKeyValue:true, key:`arg`, value:null },
			]);
		});

		test(`parseKeyValueArgs("arg=''") (empty single quotes become null)`, () => {
			expect(parseKeyValueArgs(`arg=''`)).toEqual([
				{ raw:`arg=''`, index:-1, isKeyValue:true, key:`arg`, value:null },
			]);
		});

		test(`parseKeyValueArgs('arg="bl ah"') (quoted values keep internal spaces)`, () => {
			expect(parseKeyValueArgs(`arg="bl ah"`)).toEqual([
				{ raw:`arg="bl ah"`, index:-1, isKeyValue:true, key:`arg`, value:"bl ah" },
			]);
		});

		test(`parseKeyValueArgs('arg="[a b]"') (quoted values keep brackets)`, () => {
			expect(parseKeyValueArgs(`arg="[a b]"`)).toEqual([
				{ raw:`arg="[a b]"`, index:-1, isKeyValue:true, key:`arg`, value:"[a b]" },
			]);
		});

		test(`parseKeyValueArgs('arg="say \\"hi\\""') (escaped quotes are unescaped)`, () => {
			expect(parseKeyValueArgs(`arg="say \\"hi\\""`)).toEqual([
				{ raw:`arg="say \\"hi\\""`, index:-1, isKeyValue:true, key:`arg`, value:"say \"hi\"" },
			]);
		});

		test(`parseKeyValueArgs("escaped single quotes are unescaped")`, () => {
			expect(parseKeyValueArgs(`arg='it\\'s'`)).toEqual([
				{ raw:`arg='it\\'s'`, index:-1, isKeyValue:true, key:`arg`, value:"it's" },
			]);
		});

		test(`parseKeyValueArgs('arg="a"b') (trailing junk after a quoted value is dropped)`, () => {
			expect(parseKeyValueArgs(`arg="a"b`)).toEqual([
				{ raw:`arg="a"`, index:-1, isKeyValue:true, key:`arg`, value:"a" },
			]);
		});

	});

	describe("misquoted values", () => {

		test(`parseKeyValueArgs('arg=“blah"') (mismatched double quotes are dequoted)`, () => {
			expect(parseKeyValueArgs(`arg=“blah"`)).toEqual([
				{ raw:`arg=“blah"`, index:-1, isKeyValue:true, key:`arg`, value:"blah" },
			]);
		});

		test(`parseKeyValueArgs("arg=‘blah'") (mismatched single quotes are dequoted)`, () => {
			expect(parseKeyValueArgs(`arg=‘blah'`)).toEqual([
				{ raw:`arg=‘blah'`, index:-1, isKeyValue:true, key:`arg`, value:"blah" },
			]);
		});

	});

	describe("piped values", () => {

		test(`parseKeyValueArgs("arg=||0||")`, () => {
			expect(parseKeyValueArgs(`arg=||0||`)).toEqual([
				{ raw:`arg=||0||`, index:-1, isKeyValue:true, isNaked:true, key:`arg`, value:"||0||" },
			]);
		});

		test(`parseKeyValueArgs("arg=||1 + 2||") (piped values keep internal spaces)`, () => {
			expect(parseKeyValueArgs(`arg=||1 + 2||`)).toEqual([
				{ raw:`arg=||1 + 2||`, index:-1, isKeyValue:true, isNaked:true, key:`arg`, value:"||1 + 2||" },
			]);
		});

		test(`parseKeyValueArgs("piped values keep internal newlines")`, () => {
			expect(parseKeyValueArgs(`arg=||line1\nline2||`)).toEqual([
				{ raw:`arg=||line1\nline2||`, index:-1, isKeyValue:true, isNaked:true, key:`arg`, value:"||line1\nline2||" },
			]);
		});

		test(`parseKeyValueArgs("arg=|||a|||") (triple pipes match the shortest piped pair)`, () => {
			expect(parseKeyValueArgs(`arg=|||a|||`)).toEqual([
				{ raw:`arg=|||a||`, index:-1, isKeyValue:true, isNaked:true, key:`arg`, value:"|||a||" },
			]);
		});

	});

	describe("delimiters", () => {

		test(`parseKeyValueArgs("[arg=0]") (brackets end a naked value)`, () => {
			expect(parseKeyValueArgs(`[arg=0]`)).toEqual([
				{ raw:`arg=0`, index:-1, isKeyValue:true, isNaked:true, key:`arg`, value:"0" },
			]);
		});

		test(`parseKeyValueArgs("{arg=0}") (braces end a naked value)`, () => {
			expect(parseKeyValueArgs(`{arg=0}`)).toEqual([
				{ raw:`arg=0`, index:-1, isKeyValue:true, isNaked:true, key:`arg`, value:"0" },
			]);
		});

		test(`parseKeyValueArgs("[macroName some text arg=1 more]") (only the pairs are returned)`, () => {
			expect(parseKeyValueArgs(`[macroName some text arg=1 more]`)).toEqual([
				{ raw:`arg=1`, index:-1, isKeyValue:true, isNaked:true, key:`arg`, value:"1" },
			]);
		});

	});

	describe("multiple args", () => {

		test(`parseKeyValueArgs('arg1=0 arg2="blah"')`, () => {
			expect(parseKeyValueArgs(`arg1=0 arg2="blah"`)).toEqual([
				{ raw:`arg1=0`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"0" },
				{ raw:`arg2="blah"`, index:-1, isKeyValue:true, key:`arg2`, value:"blah" },
			]);
		});

		test(`parseKeyValueArgs('arg1=||0|| arg2="blah"')`, () => {
			expect(parseKeyValueArgs(`arg1=||0|| arg2="blah"`)).toEqual([
				{ raw:`arg1=||0||`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"||0||" },
				{ raw:`arg2="blah"`, index:-1, isKeyValue:true, key:`arg2`, value:"blah" },
			]);
		});

		test(`parseKeyValueArgs(' arg2="blah" arg1=||0||') (leading whitespace)`, () => {
			expect(parseKeyValueArgs(` arg2="blah" arg1=||0||`)).toEqual([
				{ raw:`arg2="blah"`, index:-1, isKeyValue:true, key:`arg2`, value:"blah" },
				{ raw:`arg1=||0||`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"||0||" },
			]);
		});

		test(`parseKeyValueArgs("tab separated")`, () => {
			expect(parseKeyValueArgs(`a=1\tb=2`)).toEqual([
				{ raw:`a=1`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:"1" },
				{ raw:`b=2`, index:-1, isKeyValue:true, isNaked:true, key:`b`, value:"2" },
			]);
		});

		test(`parseKeyValueArgs("newline separated with trailing whitespace")`, () => {
			expect(parseKeyValueArgs(`a=1\n b=2  `)).toEqual([
				{ raw:`a=1`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:"1" },
				{ raw:`b=2`, index:-1, isKeyValue:true, isNaked:true, key:`b`, value:"2" },
			]);
		});

		test(`parseKeyValueArgs("a=1 a=2") (duplicate keys are kept)`, () => {
			expect(parseKeyValueArgs(`a=1 a=2`)).toEqual([
				{ raw:`a=1`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:"1" },
				{ raw:`a=2`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:"2" },
			]);
		});

		test(`parseKeyValueArgs("a=1 arg= b=2") (pairs without values are skipped)`, () => {
			expect(parseKeyValueArgs(`a=1 arg= b=2`)).toEqual([
				{ raw:`a=1`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:"1" },
				{ raw:`b=2`, index:-1, isKeyValue:true, isNaked:true, key:`b`, value:"2" },
			]);
		});

	});

	describe("macro blocks", () => {

		test(`parseKeyValueArgs("[macroName arg1=0]")`, () => {
			expect(parseKeyValueArgs(`[macroName arg1=0]`)).toEqual([
				{ raw:`arg1=0`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"0" },
			]);
		});

		test(`parseKeyValueArgs('[macroName arg2="blah"]')`, () => {
			expect(parseKeyValueArgs(`[macroName arg2="blah"]`)).toEqual([
				{ raw:`arg2="blah"`, index:-1, isKeyValue:true, key:`arg2`, value:"blah" },
			]);
		});

		test(`parseKeyValueArgs('[macroName arg1=0 arg2="blah"]')`, () => {
			expect(parseKeyValueArgs(`[macroName arg1=0 arg2="blah"]`)).toEqual([
				{ raw:`arg1=0`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"0" },
				{ raw:`arg2="blah"`, index:-1, isKeyValue:true, key:`arg2`, value:"blah" },
			]);
		});

		test(`parseKeyValueArgs('[macroName arg1=0\\narg2="blah"]') (newline separated)`, () => {
			expect(parseKeyValueArgs(`[macroName arg1=0\narg2="blah"]`)).toEqual([
				{ raw:`arg1=0`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"0" },
				{ raw:`arg2="blah"`, index:-1, isKeyValue:true, key:`arg2`, value:"blah" },
			]);
		});

		test(`parseKeyValueArgs('[macroName arg1=0arg2="bl ah"]') (greedy naked value swallows the next pair)`, () => {
			expect(parseKeyValueArgs(`[macroName arg1=0arg2="bl ah"]`)).toEqual([
				{ raw:`arg1=0arg2="bl`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"0arg2=\"bl" },
			]);
		});

		test(`parseKeyValueArgs('[macroName arg1=0arg2="blah"]') (greedy naked value swallows the quotes)`, () => {
			expect(parseKeyValueArgs(`[macroName arg1=0arg2="blah"]`)).toEqual([
				{ raw:`arg1=0arg2="blah"`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"0arg2=\"blah\"" },
			]);
		});

		test(`parseKeyValueArgs('[macroName  arg2="blah"arg1=0]') (quoted value ends before the next pair)`, () => {
			expect(parseKeyValueArgs(`[macroName  arg2="blah"arg1=0]`)).toEqual([
				{ raw:`arg2="blah"`, index:-1, isKeyValue:true, key:`arg2`, value:"blah" },
				{ raw:`arg1=0`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"0" },
			]);
		});

		test(`parseKeyValueArgs("[macroName  arg2='\"blah\"arg1=0']") (single quotes protect inner double quotes)`, () => {
			expect(parseKeyValueArgs(`[macroName  arg2='"blah"arg1=0']`)).toEqual([
				{ raw:`arg2='"blah"arg1=0'`, index:-1, isKeyValue:true, key:`arg2`, value:"\"blah\"arg1=0" },
			]);
		});

		test(`parseKeyValueArgs('[macroName arg1=||0|| arg2="||blah||"]')`, () => {
			expect(parseKeyValueArgs(`[macroName arg1=||0|| arg2="||blah||"]`)).toEqual([
				{ raw:`arg1=||0||`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"||0||" },
				{ raw:`arg2="||blah||"`, index:-1, isKeyValue:true, key:`arg2`, value:"||blah||" },
			]);
		});

	});

});
