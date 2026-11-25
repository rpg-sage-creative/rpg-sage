import { describe, expect, test } from "vitest";
import { sortByKey } from "../../build/index.js";

	describe("sortByKey", () => {

		const _input = [
			{ level:0, name:"nick" },
			{ level:2, name:"Zach", tag:"upper" },
			{ level:0, name:"zach" },
			{ level:0, name:"bob" },
			{ level:2, name:"nick" },
			{ level:2, name:"zach", tag:"lower" },
			{ level:2, name:"bob" },
			{ level:1, name:"nick" },
		];

		test(`sortByKey("level")`, () => {
			const input = _input.slice();
			const expected = [
				{ level:0, name:"nick" },
				{ level:0, name:"zach" },
				{ level:0, name:"bob" },
				{ level:1, name:"nick" },
				{ level:2, name:"Zach", tag:"upper" },
				{ level:2, name:"nick" },
				{ level:2, name:"zach", tag:"lower" },
				{ level:2, name:"bob" },
			];
			expect(input).not.toStrictEqual(expected);
			input.sort(sortByKey("level"));
			expect(input).toStrictEqual(expected);
		});

		test(`sortByKey("name")`, () => {
			const input = _input.slice();
			const expected = [
				{ level:0, name:"bob" },
				{ level:2, name:"bob" },
				{ level:0, name:"nick" },
				{ level:2, name:"nick" },
				{ level:1, name:"nick" },
				{ level:2, name:"Zach", tag:"upper" },
				{ level:0, name:"zach" },
				{ level:2, name:"zach", tag:"lower" },
			];
			expect(input).not.toStrictEqual(expected);
			input.sort(sortByKey("name"));
			expect(input).toStrictEqual(expected);
		});

		test(`sortByKey("name", "level")`, () => {
			const input = _input.slice();
			const expected = [
				{ level:0, name:"bob" },
				{ level:2, name:"bob" },
				{ level:0, name:"nick" },
				{ level:1, name:"nick" },
				{ level:2, name:"nick" },
				{ level:0, name:"zach" },
				{ level:2, name:"Zach", tag:"upper" },
				{ level:2, name:"zach", tag:"lower" },
			];
			expect(input).not.toStrictEqual(expected);
			input.sort(sortByKey("name", "level"));
			expect(input).toStrictEqual(expected);
		});

		test(`sortByKey("level", "name")`, () => {
			const input = _input.slice();
			const expected = [
				{ level:0, name:"bob" },
				{ level:0, name:"nick" },
				{ level:0, name:"zach" },
				{ level:1, name:"nick" },
				{ level:2, name:"bob" },
				{ level:2, name:"nick" },
				{ level:2, name:"Zach", tag:"upper" },
				{ level:2, name:"zach", tag:"lower" },
			];
			expect(input).not.toStrictEqual(expected);
			input.sort(sortByKey("level", "name"));
			expect(input).toStrictEqual(expected);
		});

		test(`sortByKey("level", "name", "tag")`, () => {
			const input = _input.slice();
			const expected = [
				{ level:0, name:"bob" },
				{ level:0, name:"nick" },
				{ level:0, name:"zach" },
				{ level:1, name:"nick" },
				{ level:2, name:"bob" },
				{ level:2, name:"nick" },
				{ level:2, name:"zach", tag:"lower" },
				{ level:2, name:"Zach", tag:"upper" },
			];
			expect(input).not.toStrictEqual(expected);
			input.sort(sortByKey("level", "name", "tag"));
			expect(input).toStrictEqual(expected);
		});

		test(`sortByKey("n") orders nullish key values last: real values, then NaN (the "third greatest"), then null, then undefined (missing keys read as undefined)`, () => {
			const input = [{ n:"b" }, { n:null }, { n:undefined }, {}, { n:Number.NaN }, { n:"a" }];
			input.sort(sortByKey<{ n?:string|number|null }>("n"));
			// the two trailing entries ({ n:undefined } then {}) keep their original relative order (stable sort)
			expect(input).toStrictEqual([{ n:"a" }, { n:"b" }, { n:Number.NaN }, { n:null }, { n:undefined }, {}]);
		});

		test(`sortByKey inherits sortPrimitive's value ordering for key values — NaN last among numbers, Invalid Dates tie at 0, -0 before 0`, () => {
			const sorter = sortByKey<{ n:number | Date }>("n");
			// NaN is the "third greatest" value: after every number...
			expect(sorter({ n:Number.NaN }, { n:5 })).toBe(1);
			expect(sorter({ n:5 }, { n:Number.NaN })).toBe(-1);
			// distinct Invalid Dates tie at 0, just as in sortPrimitive
			expect(sorter({ n:new Date(NaN) }, { n:new Date("not a date") })).toBe(0);
			// -0 sorts before 0 — the zero guard in the key loop resolves it immediately
			expect(sorter({ n:-0 }, { n:0 })).toBe(-1);
		});

		test(`case ties DEFER to later keys: a real difference on a LATER key beats a case-only tie on an earlier one`, () => {
			const sorter = sortByKey<{ name:string, level:number }>("name", "level");
			// key "name" is a case-only tie (uppercase-first would say -1); the real level difference decides instead
			expect(sorter({ name:"Zach", level:2 }, { name:"zach", level:0 })).toBe(1);
			// with no later difference, the saved case tie resolves on its own
			const oneKey = sortByKey<{ name:string }>("name");
			expect(oneKey({ name:"Zach" }, { name:"zach" })).toBe(-1);
			// and a LATER case tie never overwrites an earlier one (first deferred result wins): key "a" saves -1, key "b" would say +1 but is ignored
			const twoKeys = sortByKey<{ a:string, b:string }>("a", "b");
			expect(twoKeys({ a:"B", b:"y" }, { a:"b", b:"Y" })).toBe(-1);
		});

		test(`sign-of-zero resolves IMMEDIATELY on its key: -0 vs 0 beats a real difference on LATER keys (unlike case ties, which defer)`, () => {
			const sorter = sortByKey<{ a:number, b:string }>("a", "b");
			// the zero guard short-circuits before the case-deferral logic — key "a" decides even though key "b" differs for real
			expect(sorter({ a:-0, b:"z" }, { a:0, b:"a" })).toBe(-1);
			expect(sorter({ a:0, b:"a" }, { a:-0, b:"z" })).toBe(1);
		});

		test(`sortByKey returns 0 for identical references even when key values differ from nothing`, () => {
			const entry = { level:5, name:"solo" };
			expect(sortByKey("level")(entry, entry)).toBe(0);
		});

		test(`sortByKey with no keys always returns 0 (the key loop never runs)`, () => {
			const sorter = sortByKey<{ a:number }>();
			expect(sorter({ a:1 }, { a:2 })).toBe(0);
			// nullish operands short-circuit before the (empty) key loop; undefined is checked BEFORE null
			expect(sorter(undefined, { a:1 })).toBe(1);
			expect(sorter(null, undefined)).toBe(-1);
			expect(sorter({ a:1 }, null)).toBe(-1);
		});

	});
