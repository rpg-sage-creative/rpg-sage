import { describe, expect, test } from "vitest";
import { ArgsManager } from "../build/index.js";

enum testEnum { First = 0, NotFirst = 1 };

describe("ArgsManager", () => {

	describe("constructor", () => {

		test(`new ArgsManager() is empty`, () => {
			const args = new ArgsManager();
			expect(args.length).toBe(0);
			expect(args.raw()).toEqual([]);
			expect(args.args()).toEqual([]);
		});

		test(`new ArgsManager(undefined) is empty`, () => {
			expect(new ArgsManager(undefined).length).toBe(0);
		});

		test(`new ArgsManager([]) is empty`, () => {
			expect(new ArgsManager([]).length).toBe(0);
		});

		test(`length counts parsed args, not raw strings (blank strings are separators)`, () => {
			const args = new ArgsManager([`first`, ``, ` `, ` \t `, ` \n `, `two=too`]);
			expect(args.length).toBe(2);
			expect(args.raw().length).toBe(6);
		});

		test(`arg indexes are positions within the parsed args, not the raw strings`, () => {
			const args = new ArgsManager([`first`, ``, `two=too`]);
			expect(args.args()[0]?.index).toBe(0);
			expect(args.args()[1]?.index).toBe(1);
		});

		test(`the constructor copies the given array`, () => {
			const raw = [`a=1`];
			const args = new ArgsManager(raw);
			raw.push(`b=2`);
			expect(args.raw()).toEqual([`a=1`]);
		});

	});

	describe("parsed arg kinds", () => {

		test(`new ArgsManager(["first"]) parses a ValueArg`, () => {
			expect(new ArgsManager([`first`]).args()[0]).toEqual({ raw:`first`, index:0, isValue:true, value:`first` });
		});

		test(`new ArgsManager(["two=too"]) parses a KeyValueArg`, () => {
			expect(new ArgsManager([`two=too`]).args()[0]).toEqual({ raw:`two=too`, index:0, isKeyValue:true, isNaked:true, key:`two`, value:`too` });
		});

		test(`new ArgsManager(['three="tree"']) parses a quoted KeyValueArg`, () => {
			expect(new ArgsManager([`three="tree"`]).args()[0]).toEqual({ raw:`three="tree"`, index:0, isKeyValue:true, key:`three`, value:`tree` });
		});

		test(`new ArgsManager(["--test"]) parses a FlagArg`, () => {
			expect(new ArgsManager([`--test`]).args()[0]).toEqual({ index:0, isFlag:true, key:`test`, raw:`--test` });
		});

		test(`new ArgsManager(["hp+=5"]) parses an IncrementArg`, () => {
			expect(new ArgsManager([`hp+=5`]).args()[0]).toEqual({ index:0, isIncrement:true, key:`hp`, operator:`+`, value:5, raw:`hp+=5` });
		});

		test(`new ArgsManager(["dying--"]) parses a decrement shorthand`, () => {
			expect(new ArgsManager([`dying--`]).args()[0]).toEqual({ index:0, isIncrement:true, key:`dying`, operator:`-`, value:1, raw:`dying--` });
		});

		test(`new ArgsManager(['mp-="4"']) parses a quoted decrement`, () => {
			expect(new ArgsManager([`mp-="4"`]).args()[0]).toEqual({ index:0, isIncrement:true, key:`mp`, operator:`-`, value:4, raw:`mp-="4"` });
		});

		test(`ValueArgs do not carry the other arg flags or a key`, () => {
			const arg = new ArgsManager([`first`]).args()[0];
			expect(arg?.isFlag).toBe(undefined);
			expect(arg?.isIncrement).toBe(undefined);
			expect(arg?.isKeyValue).toBe(undefined);
			expect((arg as { key?:string }).key).toBe(undefined);
		});

	});

	describe("value arg parsing", () => {

		test(`new ArgsManager([""]) is not an arg (empty string is a separator)`, () => {
			expect(new ArgsManager([``]).length).toBe(0);
		});

		test(`new ArgsManager([" "]) is not an arg (blank string is a separator)`, () => {
			expect(new ArgsManager([` `]).length).toBe(0);
		});

		test(`new ArgsManager(['""']) parses to a null value (empty quotes is a blank string)`, () => {
			const arg = new ArgsManager([`""`]).args()[0];
			expect(arg?.isValue).toBe(true);
			expect(arg?.value).toBe(null);
		});

		test(`new ArgsManager(['" "']) keeps the space inside quotes as the value`, () => {
			const arg = new ArgsManager([`" "`]).args()[0];
			expect(arg?.isValue).toBe(true);
			expect(arg?.value).toBe(` `);
		});

		test(`new ArgsManager(['"not first"']) dequotes double quoted values`, () => {
			const arg = new ArgsManager([`"not first"`]).args()[0];
			expect(arg?.isValue).toBe(true);
			expect(arg?.value).toBe(`not first`);
		});

		test(`new ArgsManager(["'q'"]) dequotes single quoted values`, () => {
			const arg = new ArgsManager([`'q'`]).args()[0];
			expect(arg?.isValue).toBe(true);
			expect(arg?.value).toBe(`q`);
		});

		test(`new ArgsManager(["NOTFIRST"]) keeps the value as-is`, () => {
			const arg = new ArgsManager([`NOTFIRST`]).args()[0];
			expect(arg?.isValue).toBe(true);
			expect(arg?.value).toBe(`NOTFIRST`);
		});

		test(`new ArgsManager(["=foo"]) falls back to a ValueArg (no valid key)`, () => {
			const arg = new ArgsManager([`=foo`]).args()[0];
			expect(arg?.isValue).toBe(true);
			expect(arg?.value).toBe(`=foo`);
		});

		test(`new ArgsManager(["-a=1"]) falls back to a ValueArg (anchored parsers reject it)`, () => {
			const arg = new ArgsManager([`-a=1`]).args()[0];
			expect(arg?.isValue).toBe(true);
			expect(arg?.value).toBe(`-a=1`);
		});

		test(`new ArgsManager(["123"]) parses a numeric string as a ValueArg`, () => {
			const arg = new ArgsManager([`123`]).args()[0];
			expect(arg?.isValue).toBe(true);
			expect(arg?.value).toBe(`123`);
		});

	});

	describe("ArgsManager.from(string)", () => {

		test(`ArgsManager.from("first second").length === 2`, () => {
			expect(ArgsManager.from(`first second`).length).toBe(2);
		});

		test(`ArgsManager.from(sword sword='board' 'sword and board' sword='').length === 4`, () => {
			expect(ArgsManager.from(`sword sword='board' 'sword and board' sword=''`).length).toBe(4);
		});

		test(`quoted values are kept as a single token and dequoted`, () => {
			const args = ArgsManager.from(`second='two three'`);
			expect(args.length).toBe(1);
			expect(args.args()[0]).toEqual({ raw:`second='two three'`, index:0, isKeyValue:true, key:`second`, value:`two three` });
		});

		test(`quoted values keep their quotes in the raw string`, () => {
			const args = ArgsManager.from(`'quoted value'`);
			expect(args.raw()).toEqual([`'quoted value'`]);
			expect(args.valueArgs()[0]?.value).toBe(`quoted value`);
		});

		test(`space tokens are kept in raw() but filtered from the parsed args`, () => {
			const args = ArgsManager.from(`a=1 b=2`);
			expect(args.raw()).toEqual([`a=1`, ` `, `b=2`]);
			expect(args.length).toBe(2);
		});

		test(`newlines and repeated spaces are separators`, () => {
			const args = ArgsManager.from(`a=1\nb=2   c`);
			expect(args.raw()).toEqual([`a=1`, `\n`, `b=2`, `   `, `c`]);
			expect(args.length).toBe(3);
		});

		test(`ArgsManager.from("") is empty`, () => {
			const args = ArgsManager.from(``);
			expect(args.length).toBe(0);
			expect(args.raw()).toEqual([]);
		});

		test(`ArgsManager.from("   ") is empty (whitespace only)`, () => {
			expect(ArgsManager.from(`   `).length).toBe(0);
		});

		test(`additionalParsers are passed through to the tokenizer`, () => {
			const args = ArgsManager.from(`aXb`, { x:/X/ });
			expect(args.raw()).toEqual([`a`, `X`, `b`]);
			expect(args.length).toBe(3);
		});

	});

	describe("ArgsManager.from(other sources)", () => {

		test(`ArgsManager.from(array) keeps blanks in raw() but filters them from args`, () => {
			const args = ArgsManager.from([`a=1`, ``, `b=2`]);
			expect(args.raw()).toEqual([`a=1`, ``, `b=2`]);
			expect(args.length).toBe(2);
		});

		test(`ArgsManager.from(Set) accepts iterables`, () => {
			const args = ArgsManager.from(new Set([`a=1`, `b=2`]));
			expect(args.raw()).toEqual([`a=1`, `b=2`]);
			expect(args.length).toBe(2);
		});

		test(`ArgsManager.from(arrayLike) accepts array-likes`, () => {
			expect(ArgsManager.from({ length:2, 0:`a=1`, 1:`b=2` }).length).toBe(2);
		});

		test(`ArgsManager.from(manager) creates a copy with the same raw strings`, () => {
			const original = new ArgsManager([`first`, `two=too`]);
			const copy = ArgsManager.from(original);
			expect(copy).not.toBe(original);
			expect(copy.raw()).toEqual(original.raw());
			expect(copy.length).toBe(original.length);
		});

	});

	describe("returned arrays are copies", () => {

		test(`mutating args() does not change the manager`, () => {
			const args = new ArgsManager([`first`, `second`]);
			args.args().pop();
			expect(args.length).toBe(2);
		});

		test(`mutating raw() does not change the manager`, () => {
			const args = new ArgsManager([`first`]);
			args.raw().push(`mutated`);
			expect(args.raw()).toEqual([`first`]);
		});

		test(`mutating valueArgs() does not change the cache`, () => {
			const args = new ArgsManager([`first`, `second`]);
			args.valueArgs().pop();
			expect(args.valueArgs().length).toBe(2);
		});

		test(`mutating flagArgs() does not change the cache`, () => {
			const args = new ArgsManager([`--x`, `--y`]);
			args.flagArgs().pop();
			expect(args.flagArgs().length).toBe(2);
		});

	});

	describe("findKeyValueArg", () => {

		test(`returns the KeyValueArg for the given key`, () => {
			const args = new ArgsManager([`a=1`, `b=2`]);
			expect(args.findKeyValueArg(`b`)?.value).toBe(`2`);
		});

		test(`returns undefined when the key is not found`, () => {
			expect(new ArgsManager([`a=1`]).findKeyValueArg(`zzz`)).toBe(undefined);
		});

		test(`returns the first occurrence of duplicate keys`, () => {
			const args = new ArgsManager([`a=1`, `a=2`]);
			expect(args.findKeyValueArg(`a`)?.value).toBe(`1`);
		});

		test(`additional keys are tried in order given (not arg order)`, () => {
			const args = new ArgsManager([`a=1`, `b=2`]);
			expect(args.findKeyValueArg(`b`, `a`)?.key).toBe(`b`);
			expect(args.findKeyValueArg(`a`, `b`)?.key).toBe(`a`);
		});

		test(`keys are compared against keyLower; uppercase input is not matched`, () => {
			const args = new ArgsManager([`C=3`]);
			expect(args.findKeyValueArg(`c`)?.value).toBe(`3`);
			expect(args.findKeyValueArg(`C` as Lowercase<string>)).toBe(undefined);
		});

	});

	describe("hasFlag", () => {

		test(`returns true when the flag is found`, () => {
			expect(new ArgsManager([`--test`]).hasFlag(`test`)).toBe(true);
		});

		test(`flag keys are matched case-insensitively (--TEST matches "test")`, () => {
			expect(new ArgsManager([`--TEST`]).hasFlag(`test`)).toBe(true);
		});

		test(`returns true when any of the additional keys match`, () => {
			expect(new ArgsManager([`--verbose`]).hasFlag(`quiet`, `verbose`)).toBe(true);
		});

		test(`given keys are not lowercased; uppercase input is not matched`, () => {
			expect(new ArgsManager([`--TEST`]).hasFlag(`TEST` as Lowercase<string>)).toBe(false);
		});

		test(`returns false when the flag is missing`, () => {
			expect(new ArgsManager([`--test`]).hasFlag(`zzz`)).toBe(false);
		});

		test(`returns false on an empty manager`, () => {
			expect(new ArgsManager().hasFlag(`test`)).toBe(false);
		});

	});

	describe("keyValueArgs and incrementArgs", () => {

		test(`keyValueArgs() returns all KeyValueArgs`, () => {
			const args = new ArgsManager([`two=too`, `three=tree`, `--test`, `first`]);
			expect(args.keyValueArgs().map(arg => arg.key)).toEqual([`two`, `three`]);
		});

		test(`keyValueArgs(key) filters by key, case-insensitively`, () => {
			const args = new ArgsManager([`two=too`, `three=tree`]);
			expect(args.keyValueArgs(`TWo` as Lowercase<string>).length).toBe(1);
			expect(args.keyValueArgs(`TwO` as Lowercase<string>, `thREe` as Lowercase<string>).length).toBe(2);
		});

		test(`keyValueArgs(key) returns [] when nothing matches`, () => {
			expect(new ArgsManager([`two=too`]).keyValueArgs(`zzz`).length).toBe(0);
		});

		test(`keyValueArgs(key) returns every duplicate`, () => {
			expect(new ArgsManager([`a=1`, `a=2`]).keyValueArgs(`a`).length).toBe(2);
		});

		test(`incrementArgs() returns all IncrementArgs in order`, () => {
			const args = new ArgsManager([`first`, `hp+=5`, `--test`, `dying--`, `mp-="4"`]);
			expect(args.incrementArgs().map(arg => arg.key)).toEqual([`hp`, `dying`, `mp`]);
		});

		test(`incrementArgs(key) filters by key, case-insensitively`, () => {
			const args = new ArgsManager([`hp+=5`, `MP-=2`]);
			expect(args.incrementArgs(`mp`).length).toBe(1);
			expect(args.incrementArgs().length).toBe(2);
		});

		test(`incrementArgs(key) returns [] when nothing matches`, () => {
			expect(new ArgsManager([`hp+=5`]).incrementArgs(`zzz`).length).toBe(0);
		});

	});

	describe("flagArgs and valueArgs", () => {

		test(`flagArgs() returns all FlagArgs with their indexes`, () => {
			const args = new ArgsManager([`first`, `two=too`, `--test`]);
			expect(args.flagArgs().map(arg => arg.key)).toEqual([`test`]);
			expect(args.flagArgs()[0]?.index).toBe(2);
		});

		test(`valueArgs() returns all ValueArgs with their indexes`, () => {
			const args = new ArgsManager([`first`, `two=too`, `""`]);
			expect(args.valueArgs().map(arg => arg.index)).toEqual([0, 2]);
			expect(args.valueArgs()[1]?.value).toBe(null);
		});

		test(`flagArgs() and valueArgs() are empty on an empty manager`, () => {
			const args = new ArgsManager();
			expect(args.flagArgs()).toEqual([]);
			expect(args.valueArgs()).toEqual([]);
		});

	});

	describe("nonKeyValueArgs and nonKeyValueStrings", () => {

		test(`nonKeyValueArgs() excludes KeyValueArgs`, () => {
			const args = new ArgsManager([`first`, `two=too`, `--test`, `hp+=5`]);
			expect(args.nonKeyValueArgs().map(arg => arg.raw)).toEqual([`first`, `--test`, `hp+=5`]);
		});

		test(`nonKeyValueStrings() returns raw strings for non-value args and values for value args`, () => {
			const args = new ArgsManager([`first`, `two=too`, `--test`]);
			expect(args.nonKeyValueStrings()).toEqual([`first`, `--test`]);
		});

		test(`nonKeyValueStrings() includes null for empty-quoted ValueArgs`, () => {
			const args = new ArgsManager([`first`, `""`, `two=too`]);
			expect(args.nonKeyValueStrings()).toEqual([`first`, null]);
		});

	});

	describe("enumValues", () => {

		test(`maps ValueArgs to enum values case-insensitively`, () => {
			const args = new ArgsManager([`first`, `NOTFIRST`]);
			expect(args.enumValues(testEnum)).toStrictEqual([0, 1]);
		});

		test(`filters out values that are not in the enum`, () => {
			const args = new ArgsManager([`first`, `bogus`]);
			expect(args.enumValues(testEnum)).toStrictEqual([0]);
		});

		test(`ignores KeyValueArgs, Flags, and Increments (only ValueArgs are mapped)`, () => {
			const args = new ArgsManager([`two=too`, `--test`, `hp+=5`, `first`]);
			expect(args.enumValues(testEnum)).toStrictEqual([0]);
		});

		test(`skips null values from empty-quoted ValueArgs`, () => {
			const args = new ArgsManager([`""`, `first`, `bogus`]);
			expect(args.enumValues(testEnum)).toStrictEqual([0]);
		});

		test(`returns [] on an empty manager`, () => {
			expect(new ArgsManager().enumValues(testEnum)).toStrictEqual([]);
		});

	});

	describe("raw and args", () => {

		test(`raw() returns the original strings in order, including separators`, () => {
			const raw = [`first`, ``, `two=too`];
			expect(new ArgsManager(raw).raw()).toEqual([`first`, ``, `two=too`]);
		});

		test(`args() exposes parsed args of every kind with sequential indexes`, () => {
			const args = new ArgsManager([`first`, `two=too`, `three="tree"`, `--test`, `hp+=5`, `""`, `" "`, `'q'`, `NOTFIRST`, `dying--`, `mp-="4"`]);
			expect(args.length).toBe(11);
			expect(args.args().map(arg => arg.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
			const [value, kv, quotedKv, flag, increment, emptyQuoted, spaceQuoted, singleQuoted, upper, decrement, quotedDecrement] = args.args();
			expect(value?.isValue).toBe(true);
			expect(kv?.key).toBe(`two`);
			expect(quotedKv?.value).toBe(`tree`);
			expect(flag?.isFlag).toBe(true);
			expect(increment?.operator).toBe(`+`);
			expect(emptyQuoted?.value).toBe(null);
			expect(spaceQuoted?.value).toBe(` `);
			expect(singleQuoted?.value).toBe(`q`);
			expect(upper?.value).toBe(`NOTFIRST`);
			expect(decrement?.operator).toBe(`-`);
			expect((quotedDecrement as { value?:number }).value).toBe(4);
		});

	});

});
