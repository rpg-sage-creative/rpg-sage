import { describe, expect, test } from "vitest";
import {
	IntegerStringRegExp,
	NumberRegExp,
	isBigInt,
	isBoolean,
	isDefined,
	isFiniteNumber,
	isIntegerString,
	isNegativeZero,
	isNull,
	isNullOrUndefined,
	isNumber,
	isNumberString,
	isNumeric,
	isPrimitive,
	isSimpleNumberString,
	isSimpleObject,
	isString,
	isUndefined
} from "../build/index.js";

describe("typeGuards", () => {

	describe("isBigInt", () => {
		test(`isBigInt(0n) === true`, () => expect(isBigInt(0n)).toBe(true));
		test(`isBigInt(-5n) === true`, () => expect(isBigInt(-5n)).toBe(true));
		test(`isBigInt(0) === false — number is not bigint`, () => expect(isBigInt(0)).toBe(false));
		test(`isBigInt("5") === false`, () => expect(isBigInt("5")).toBe(false));
		test(`isBigInt(null) === false`, () => expect(isBigInt(null)).toBe(false));
	});

	describe("isBoolean", () => {
		test(`isBoolean(true) === true`, () => expect(isBoolean(true)).toBe(true));
		test(`isBoolean(false) === true — falsy booleans still pass`, () => expect(isBoolean(false)).toBe(true));
		test(`isBoolean(0) === false`, () => expect(isBoolean(0)).toBe(false));
		test(`isBoolean("true") === false`, () => expect(isBoolean("true")).toBe(false));
		test(`isBoolean(null) === false`, () => expect(isBoolean(null)).toBe(false));
	});

	describe("isDefined", () => {
		test(`isDefined({}) === true`, () => expect(isDefined({})).toBe(true));
		test(`isDefined("") === true — falsy but defined`, () => expect(isDefined("")).toBe(true));
		test(`isDefined(0) === true — falsy but defined`, () => expect(isDefined(0)).toBe(true));
		test(`isDefined(null) === false`, () => expect(isDefined(null)).toBe(false));
		test(`isDefined(undefined) === false`, () => expect(isDefined(undefined)).toBe(false));
	});

	describe("isFiniteNumber", () => {
		test(`isFiniteNumber(0) === true`, () => expect(isFiniteNumber(0)).toBe(true));
		test(`isFiniteNumber(-1.5) === true`, () => expect(isFiniteNumber(-1.5)).toBe(true));
		test(`isFiniteNumber(NaN) === false — a number, but not finite`, () => expect(isFiniteNumber(NaN)).toBe(false));
		test(`isFiniteNumber(Infinity) === false`, () => expect(isFiniteNumber(Infinity)).toBe(false));
		test(`isFiniteNumber(-Infinity) === false`, () => expect(isFiniteNumber(-Infinity)).toBe(false));
		test(`isFiniteNumber("5") === false — numeric string is not a number`, () => expect(isFiniteNumber("5")).toBe(false));
		test(`isFiniteNumber(5n) === false`, () => expect(isFiniteNumber(5n)).toBe(false));
	});

	describe("isIntegerString", () => {
		test(`isIntegerString("5") === true`, () => expect(isIntegerString("5")).toBe(true));
		test(`isIntegerString("+5") === true — leading + allowed`, () => expect(isIntegerString("+5")).toBe(true));
		test(`isIntegerString("-5") === true — leading - allowed`, () => expect(isIntegerString("-5")).toBe(true));
		test(`isIntegerString("05") === true — leading zeros allowed`, () => expect(isIntegerString("05")).toBe(true));
		test(`isIntegerString("-0") === true`, () => expect(isIntegerString("-0")).toBe(true));
		test(`isIntegerString(".5") === false — no bare decimal point`, () => expect(isIntegerString(".5")).toBe(false));
		test(`isIntegerString("5.0") === false — decimals rejected`, () => expect(isIntegerString("5.0")).toBe(false));
		test(`isIntegerString("1e3") === false — exponents rejected`, () => expect(isIntegerString("1e3")).toBe(false));
		test(`isIntegerString("") === false`, () => expect(isIntegerString("")).toBe(false));
		test(`isIntegerString(5) === false — number input is not a string`, () => expect(isIntegerString(5)).toBe(false));
		test(`isIntegerString(null) === false`, () => expect(isIntegerString(null)).toBe(false));

		test(`IntegerStringRegExp is anchored — "a5b" does not match`, () => expect(IntegerStringRegExp.test("a5b")).toBe(false));
		test(`IntegerStringRegExp matches "-42"`, () => expect(IntegerStringRegExp.test("-42")).toBe(true));
	});

	describe("isNegativeZero", () => {
		test(`isNegativeZero(-0) === true`, () => expect(isNegativeZero(-0)).toBe(true));
		test(`isNegativeZero(0) === false — positive zero fails the 1/value test`, () => expect(isNegativeZero(0)).toBe(false));
		test(`isNegativeZero(-1) === false`, () => expect(isNegativeZero(-1)).toBe(false));
		test(`isNegativeZero(NaN) === false`, () => expect(isNegativeZero(NaN)).toBe(false));
		test(`isNegativeZero("-0") === false — string is not the number -0`, () => expect(isNegativeZero("-0")).toBe(false));
		test(`isNegativeZero(null) === false`, () => expect(isNegativeZero(null)).toBe(false));

		test(`-0 survives as an object key distinct from 0 only via value checks, not keys`, () => {
			// QUIRK: -0 and 0 share the same property key ("0"), so key-based lookups cannot tell them apart.
			const map = new Map<string, string>([["-0", "neg"]]);
			expect(isNegativeZero(Number("-0"))).toBe(true);
			expect(map.has("0")).toBe(false);
		});
	});

	describe("isNull", () => {
		test(`isNull(null) === true`, () => expect(isNull(null)).toBe(true));
		test(`isNull(undefined) === false — undefined is not null`, () => expect(isNull(undefined)).toBe(false));
		test(`isNull(0) === false`, () => expect(isNull(0)).toBe(false));
		test(`isNull("") === false`, () => expect(isNull("")).toBe(false));
		test(`isNull(false) === false`, () => expect(isNull(false)).toBe(false));
	});

	describe("isNullOrUndefined", () => {
		test(`isNullOrUndefined(null) === true`, () => expect(isNullOrUndefined(null)).toBe(true));
		test(`isNullOrUndefined(undefined) === true`, () => expect(isNullOrUndefined(undefined)).toBe(true));
		test(`isNullOrUndefined(0) === false — falsy but neither null nor undefined`, () => expect(isNullOrUndefined(0)).toBe(false));
		test(`isNullOrUndefined("") === false`, () => expect(isNullOrUndefined("")).toBe(false));
		test(`isNullOrUndefined(false) === false`, () => expect(isNullOrUndefined(false)).toBe(false));
	});

	describe("isNumber", () => {
		test(`isNumber(5) === true`, () => expect(isNumber(5)).toBe(true));
		test(`isNumber(-0) === true`, () => expect(isNumber(-0)).toBe(true));
		// QUIRK: typeof semantics — NaN and ±Infinity ARE numbers.
		test(`isNumber(NaN) === true — NaN is a number by typeof`, () => expect(isNumber(NaN)).toBe(true));
		test(`isNumber(Infinity) === true — Infinity is a number by typeof`, () => expect(isNumber(Infinity)).toBe(true));
		test(`isNumber("5") === false`, () => expect(isNumber("5")).toBe(false));
		test(`isNumber(5n) === false — bigint is not number`, () => expect(isNumber(5n)).toBe(false));
		test(`isNumber(null) === false`, () => expect(isNumber(null)).toBe(false));
	});

	describe("isNumberString", () => {
		test(`isNumberString("5") === true`, () => expect(isNumberString("5")).toBe(true));
		test(`isNumberString("+5") === true — leading + allowed`, () => expect(isNumberString("+5")).toBe(true));
		test(`isNumberString("-5.25") === true — signed decimal allowed`, () => expect(isNumberString("-5.25")).toBe(true));
		test(`isNumberString(".5") === false — no bare decimal point`, () => expect(isNumberString(".5")).toBe(false));
		test(`isNumberString("1.") === false — trailing decimal point rejected`, () => expect(isNumberString("1.")).toBe(false));
		test(`isNumberString("1e3") === false — exponents rejected`, () => expect(isNumberString("1e3")).toBe(false));
		test(`isNumberString("") === false`, () => expect(isNumberString("")).toBe(false));
		test(`isNumberString(" 5") === false — surrounding whitespace rejected`, () => expect(isNumberString(" 5")).toBe(false));
		test(`isNumberString("abc123") === false — guard is anchored even though NumberRegExp is not`, () => expect(isNumberString("abc123")).toBe(false));
		test(`isNumberString(5) === false — number input is not a string`, () => expect(isNumberString(5)).toBe(false));

		// QUIRK: the EXPORTED NumberRegExp is intentionally unanchored (extraction), while the guard uses a private anchored copy.
		test(`NumberRegExp is UNANCHORED — matches "abc123"`, () => expect(NumberRegExp.test("abc123")).toBe(true));
		test(`NumberRegExp extracts "-5.25" from surrounding text`, () => expect(NumberRegExp.exec("x-5.25y")?.[0]).toBe("-5.25"));
	});

	describe("isNumeric", () => {
		test(`isNumeric(5) === true`, () => expect(isNumeric(5)).toBe(true));
		test(`isNumeric(-1.5) === true`, () => expect(isNumeric(-1.5)).toBe(true));
		// QUIRK: typeof semantics — NaN and ±Infinity ARE numeric.
		test(`isNumeric(NaN) === true — NaN is numeric by typeof`, () => expect(isNumeric(NaN)).toBe(true));
		test(`isNumeric(Infinity) === true — Infinity is numeric by typeof`, () => expect(isNumeric(Infinity)).toBe(true));
		test(`isNumeric(5n) === true — bigint is numeric`, () => expect(isNumeric(5n)).toBe(true));
		test(`isNumeric("5") === false — string never numeric`, () => expect(isNumeric("5")).toBe(false));
		test(`isNumeric(null) === false`, () => expect(isNumeric(null)).toBe(false));
	});

	describe("isPrimitive", () => {
		test(`isPrimitive(null) === true`, () => expect(isPrimitive(null)).toBe(true));
		test(`isPrimitive(undefined) === true`, () => expect(isPrimitive(undefined)).toBe(true));
		test(`isPrimitive(true) === true`, () => expect(isPrimitive(true)).toBe(true));
		test(`isPrimitive(0) === true`, () => expect(isPrimitive(0)).toBe(true));
		test(`isPrimitive(NaN) === true`, () => expect(isPrimitive(NaN)).toBe(true));
		test(`isPrimitive("") === true`, () => expect(isPrimitive("")).toBe(true));
		test(`isPrimitive(0n) === true`, () => expect(isPrimitive(0n)).toBe(true));
		// Documented @todo in src: Date is deliberately treated as primitive.
		test(`isPrimitive(new Date()) === true — Date counts as primitive by design`, () => expect(isPrimitive(new Date())).toBe(true));

		// QUIRK: symbol is NOT in the accepted typeof list, despite being a JS primitive.
		test(`isPrimitive(Symbol("x")) === false — symbols are excluded`, () => expect(isPrimitive(Symbol("x"))).toBe(false));
		test(`isPrimitive(() => {}) === false — functions are not primitives`, () => expect(isPrimitive(() => {})).toBe(false));
		test(`isPrimitive([]) === false`, () => expect(isPrimitive([])).toBe(false));
		test(`isPrimitive({}) === false`, () => expect(isPrimitive({})).toBe(false));
	});

	describe("isSimpleNumberString", () => {
		test(`isSimpleNumberString("5") === true`, () => expect(isSimpleNumberString("5")).toBe(true));
		test(`isSimpleNumberString("05") === true — leading zeros allowed`, () => expect(isSimpleNumberString("05")).toBe(true));
		test(`isSimpleNumberString("-5") === false — sign rejected (unlike isIntegerString)`, () => expect(isSimpleNumberString("-5")).toBe(false));
		test(`isSimpleNumberString("+5") === false — sign rejected`, () => expect(isSimpleNumberString("+5")).toBe(false));
		test(`isSimpleNumberString("5.5") === false — decimals rejected`, () => expect(isSimpleNumberString("5.5")).toBe(false));
		test(`isSimpleNumberString("") === false`, () => expect(isSimpleNumberString("")).toBe(false));
		test(`isSimpleNumberString(5) === false — number input is not a string`, () => expect(isSimpleNumberString(5)).toBe(false));
	});

	describe("isSimpleObject", () => {
		test(`isSimpleObject({}) === true`, () => expect(isSimpleObject({})).toBe(true));
		test(`isSimpleObject(new Object()) === true`, () => expect(isSimpleObject(new Object())).toBe(true));
		test(`isSimpleObject([]) === false — arrays are not simple objects`, () => expect(isSimpleObject([])).toBe(false));

		class Foo {}
		test(`isSimpleObject(new Foo()) === false — class instances are not simple objects`, () => expect(isSimpleObject(new Foo())).toBe(false));

		// QUIRK: the constructor check dereferences .constructor, so null-prototype objects fail.
		test(`isSimpleObject(Object.create(null)) === false — no constructor to compare`, () => expect(isSimpleObject(Object.create(null))).toBe(false));

		// QUIRK: an OWN "constructor" property shadows the prototype's and breaks the check.
		test(`isSimpleObject({ constructor: 1 }) === false — shadowed constructor defeats the guard`, () => expect(isSimpleObject({ constructor:1 })).toBe(false));

		test(`isSimpleObject(null) === false`, () => expect(isSimpleObject(null)).toBe(false));
		test(`isSimpleObject("") === false — falsy input short-circuits`, () => expect(isSimpleObject("")).toBe(false));
	});

	describe("isString", () => {
		test(`isString("") === true — empty string is a string`, () => expect(isString("")).toBe(true));
		test(`isString("control") === true`, () => expect(isString("control")).toBe(true));
		// QUIRK: String objects (new String(...)) are typeof "object".
		test(`isString(new String("x")) === false — boxed strings are objects`, () => {
			const boxed = new String("x");
			expect(isString(boxed)).toBe(false);
		});
		test(`isString(5) === false`, () => expect(isString(5)).toBe(false));
		test(`isString(null) === false`, () => expect(isString(null)).toBe(false));
		test(`isString(undefined) === false`, () => expect(isString(undefined)).toBe(false));
	});

	describe("isUndefined", () => {
		test(`isUndefined(undefined) === true`, () => expect(isUndefined(undefined)).toBe(true));
		test(`isUndefined(null) === false — null is not undefined`, () => expect(isUndefined(null)).toBe(false));
		test(`isUndefined(0) === false`, () => expect(isUndefined(0)).toBe(false));
		test(`isUndefined("") === false`, () => expect(isUndefined("")).toBe(false));
	});

	describe("cross-guard matrix", () => {
		// The handful of values where guards disagree in ways callers trip over.
		test(`null: isDefined false but isPrimitive true`, () => {
			expect(isDefined(null)).toBe(false);
			expect(isPrimitive(null)).toBe(true);
		});

		test(`NaN: isNumber/isNumeric/isPrimitive true, isFiniteNumber false`, () => {
			expect(isNumber(NaN)).toBe(true);
			expect(isNumeric(NaN)).toBe(true);
			expect(isPrimitive(NaN)).toBe(true);
			expect(isFiniteNumber(NaN)).toBe(false);
		});

		test(`"5": string guards true, number guards false`, () => {
			expect(isString("5")).toBe(true);
			expect(isNumberString("5")).toBe(true);
			expect(isIntegerString("5")).toBe(true);
			expect(isSimpleNumberString("5")).toBe(true);
			expect(isNumber("5")).toBe(false);
			expect(isNumeric("5")).toBe(false);
		});

		test(`0n: isBigInt/isNumeric/isPrimitive true, number guards false`, () => {
			expect(isBigInt(0n)).toBe(true);
			expect(isNumeric(0n)).toBe(true);
			expect(isPrimitive(0n)).toBe(true);
			expect(isNumber(0n)).toBe(false);
			expect(isFiniteNumber(0n)).toBe(false);
		});

		test(`[]: defined object, not primitive, not simple`, () => {
			expect(isDefined([])).toBe(true);
			expect(isPrimitive([])).toBe(false);
			expect(isSimpleObject([])).toBe(false);
		});
	});

});
