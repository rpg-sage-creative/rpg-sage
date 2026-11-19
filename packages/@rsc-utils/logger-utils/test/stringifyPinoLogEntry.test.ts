import { describe, expect, test } from "vitest";
import { stringifyPinoLogEntry } from "../build/index.js";

describe("stringifyPinoLogEntry", () => {

	describe("inputs that fail the PinoLogEntry guard are stringified as-is", () => {

		test(`strings become JSON strings`, () => {
			expect(stringifyPinoLogEntry("hello")).toBe(`"hello"`);
		});

		test(`numbers and booleans stringify directly`, () => {
			expect(stringifyPinoLogEntry(42)).toBe("42");
			expect(stringifyPinoLogEntry(true)).toBe("true");
		});

		test(`null stringifies to "null"`, () => {
			expect(stringifyPinoLogEntry(null)).toBe("null");
		});

		test(`FIXED: undefined no longer throws — root values JSON.stringify cannot represent short-circuit to String() before stringifyJson is called`, () => {
			expect(stringifyPinoLogEntry(undefined)).toBe("undefined");
		});

		test(`functions at the root fall back to String() instead of throwing`, () => {
			const fn = function named() {};
			expect(stringifyPinoLogEntry(fn)).toBe(String(fn));
			expect(stringifyPinoLogEntry(() => {}).startsWith("(")).toBe(true); // arrow source text
		});

		test(`symbols at the root fall back to String() instead of throwing`, () => {
			expect(stringifyPinoLogEntry(Symbol("s"))).toBe("Symbol(s)");
		});

		test(`objects without a level are plain-stringified`, () => {
			expect(stringifyPinoLogEntry({ a:1 })).toBe(`{ "a": 1 }`);
		});

		test(`arrays are plain-stringified`, () => {
			expect(stringifyPinoLogEntry([1,2])).toBe("[ 1, 2 ]");
		});

		test(`a string level fails the numeric-level check and falls through to raw stringify`, () => {
			expect(stringifyPinoLogEntry({ level:"info" })).toBe(`{ "level": "info" }`);
		});

	});

	describe("valid entries get sectioned output", () => {

		test(`a bare entry produces the level header and Raw only`, () => {
			expect(stringifyPinoLogEntry({ level:30 })).toBe(
				`Log Level: info\n\nRaw\n-------\n{ "level": 30 }`
			);
		});

		test(`all six standard pino v10 levels label correctly`, () => {
			expect(stringifyPinoLogEntry({ level:10 }).startsWith("Log Level: trace")).toBe(true);
			expect(stringifyPinoLogEntry({ level:20 }).startsWith("Log Level: debug")).toBe(true);
			expect(stringifyPinoLogEntry({ level:30 }).startsWith("Log Level: info")).toBe(true);
			expect(stringifyPinoLogEntry({ level:40 }).startsWith("Log Level: warn")).toBe(true);
			expect(stringifyPinoLogEntry({ level:50 }).startsWith("Log Level: error")).toBe(true);
			expect(stringifyPinoLogEntry({ level:60 }).startsWith("Log Level: fatal")).toBe(true);
		});

		test(`QUIRK: an unmapped level number renders the literal "undefined" in the header`, () => {
			expect(stringifyPinoLogEntry({ level:99 })).toBe(
				`Log Level: undefined\n\nRaw\n-------\n{ "level": 99 }`
			);
		});

		test(`a truthy msg adds a Message section between the header and Raw`, () => {
			expect(stringifyPinoLogEntry({ level:40, msg:"careful" })).toBe(
				`Log Level: warn\n\nMessage\n-------\ncareful\n\nRaw\n-------\n{ "level": 40, "msg": "careful" }`
			);
		});

		test(`QUIRK: an empty-string msg skips the Message section but still appears in Raw`, () => {
			const result = stringifyPinoLogEntry({ level:30, msg:"" });
			expect(result).not.toContain("Message");
			expect(result).toContain(`"msg": ""`);
		});

	});

	describe("err handling", () => {

		test(`QUIRK: a real Error renders name + message + stack in the Error section but serializes as {} in Raw (Error props are non-enumerable)`, () => {
			const err = new Error("boom");
			const result = stringifyPinoLogEntry({ level:50, err });
			expect(result).toContain(`Log Level: error`);
			expect(result).toContain(`Error\n-------\nError: boom\n${err.stack}`);
			expect(result).toContain(`"err": {}`);
		});

		test(`an ErrorLike without a stack shows only the joined name/message line`, () => {
			const result = stringifyPinoLogEntry({ level:50, err:{ name:"E", message:"m" } });
			expect(result).toContain("Error\n-------\nE: m\n");
		});

		test(`name-only and message-only ErrorLikes join to the single present part`, () => {
			expect(stringifyPinoLogEntry({ level:50, err:{ name:"E", message:"" } })).toContain("Error\n-------\nE\n");
			expect(stringifyPinoLogEntry({ level:50, err:{ name:"", message:"m" } })).toContain("Error\n-------\nm\n");
		});

		test(`QUIRK: a non-ErrorLike err (empty object) fails the whole entry guard — no sections at all, raw JSON only`, () => {
			expect(stringifyPinoLogEntry({ level:50, err:{} })).toBe(
				`{\n\t"level": 50,\n\t"err": {}\n}`
			);
		});

		test(`QUIRK: a string err also fails the whole entry guard`, () => {
			expect(stringifyPinoLogEntry({ level:50, err:"oops" })).toBe(`{ "level": 50, "err": "oops" }`);
		});

	});

	describe("raw section formatting", () => {

		test(`bigints use the json-utils $bigint wire format in Raw`, () => {
			const result = stringifyPinoLogEntry({ level:30, big:1n });
			expect(result).toContain(`"big": { "$bigint": "1" }`);
		});

		test(`maxLineLength controls how aggressively Raw JSON lines are wrapped/inlined`, () => {
			const entry = { level:30, msg:"x".repeat(50) };
			expect(stringifyPinoLogEntry(entry)).not.toContain("\n\t"); // default 80 keeps it inline-ish
			const narrow = stringifyPinoLogEntry(entry, 20);
			expect(narrow).toContain("\n\t"); // forced multi-line under the limit
		});

		test(`the Raw section is always present, even with nothing else`, () => {
			expect(stringifyPinoLogEntry({ level:30 })).toContain("Raw\n-------\n");
		});

	});

});
