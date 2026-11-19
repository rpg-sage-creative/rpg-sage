import { describe, expect, test } from "vitest";
import type { EnumLike } from "../build/index.js";
import { Enum, getEnumKeys, getEnumValues, parseEnum } from "../build/index.js";

enum DayNight {
	Day = 0,
	Night = 1,
}

enum ColorString {
	Red = "red",
	Blue = "blue",
}

describe("enums", () => {

	describe("getEnumKeys", () => {
		test(`getEnumKeys(DayNight) === ["Day","Night"] — reverse-mapping keys ("0"/"1") are filtered out`, () => {
			expect(getEnumKeys(DayNight)).toEqual(["Day","Night"]);
		});

		test(`getEnumKeys({}) === []`, () => {
			expect(getEnumKeys({})).toEqual([]);
		});

		// QUIRK: string enums are rejected by the EnumLike typing (values must be numbers).
		// Forced past the type, the runtime number-filter still yields [].
		test(`getEnumValues/keys on a forced string enum === [] — number filter drops everything`, () => {
			const forced = ColorString as unknown as EnumLike<keyof typeof ColorString, number>;
			expect(getEnumKeys(forced)).toEqual([]);
			expect(getEnumValues(forced)).toEqual([]);
		});

		test(`string enums are a COMPILE error — EnumLike requires numeric values`, () => {
			// @ts-expect-error — string enum values fail the EnumLike number constraint.
			getEnumKeys(ColorString);
			// @ts-expect-error — same for getEnumValues.
			getEnumValues(ColorString);
			// @ts-expect-error — and parseEnum.
			parseEnum(ColorString, "Red");
		});
	});

	describe("getEnumValues", () => {
		test(`getEnumValues(DayNight) === [0,1]`, () => {
			expect(getEnumValues(DayNight)).toEqual([0,1]);
		});

		test(`getEnumValues({}) === []`, () => {
			expect(getEnumValues({})).toEqual([]);
		});
	});

	describe("parseEnum", () => {
		test(`parseEnum(DayNight, 0) === DayNight.Day — value type is inferred from the enum`, () => {
			const parsed: DayNight | undefined = parseEnum(DayNight, 0);
			expect(parsed).toBe(DayNight.Day);
		});

		test(`parseEnum(DayNight, 1) === DayNight.Night`, () => {
			expect(parseEnum(DayNight, 1)).toBe(DayNight.Night);
		});

		test(`parseEnum(DayNight, "day") === DayNight.Day — key match is case-insensitive`, () => {
			expect(parseEnum(DayNight, "day")).toBe(DayNight.Day);
		});

		test(`parseEnum(DayNight, "Day") === DayNight.Day`, () => {
			expect(parseEnum(DayNight, "Day")).toBe(DayNight.Day);
		});

		test(`parseEnum(DayNight, "DAY") === DayNight.Day — upper-case key still matches`, () => {
			expect(parseEnum(DayNight, "DAY")).toBe(DayNight.Day);
		});

		// QUIRK: numeric strings are matched against KEYS only; the reverse-mapped value "1" is not consulted.
		test(`parseEnum(DayNight, "1") === undefined — numeric strings do not match reverse mappings`, () => {
			expect(parseEnum(DayNight, "1")).toBeUndefined();
		});

		test(`parseEnum(DayNight, 2) === undefined — value not in enum`, () => {
			expect(parseEnum(DayNight, 2)).toBeUndefined();
		});

		test(`parseEnum(DayNight, "daynight") === undefined — key not in enum`, () => {
			expect(parseEnum(DayNight, "daynight")).toBeUndefined();
		});

		test(`parseEnum(DayNight, undefined) === undefined`, () => {
			expect(parseEnum(DayNight, undefined)).toBeUndefined();
		});

		test(`parseEnum(DayNight, null) === undefined`, () => {
			expect(parseEnum(DayNight, null)).toBeUndefined();
		});

		test(`parseEnum(DayNight, 2, DayNight.Night) === DayNight.Night — defaultValue on value miss`, () => {
			expect(parseEnum(DayNight, 2, DayNight.Night)).toBe(DayNight.Night);
		});

		test(`parseEnum(DayNight, "nope", DayNight.Day) === DayNight.Day — defaultValue on key miss`, () => {
			expect(parseEnum(DayNight, "nope", DayNight.Day)).toBe(DayNight.Day);
		});

		test(`parseEnum(DayNight, null, DayNight.Night) === DayNight.Night — defaultValue for null`, () => {
			expect(parseEnum(DayNight, null, DayNight.Night)).toBe(DayNight.Night);
		});

		test(`parseEnum(DayNight, undefined, DayNight.Day) === DayNight.Day — falsy default still wins (?? semantics)`, () => {
			expect(parseEnum(DayNight, undefined, DayNight.Day)).toBe(DayNight.Day);
		});

		test(`parseEnum({}, "x", 5) === 5 — empty enum falls to defaultValue without throwing`, () => {
			expect(parseEnum({} as EnumLike, "x", 5)).toBe(5);
		});

		test(`parseEnum(null, "x") throws TypeError — null/undefined enums are not guarded`, () => {
			// @ts-expect-error — the EnumLike typing rejects null; the runtime still reaches Object.keys and throws.
			expect(() => parseEnum(null, "x")).toThrow(TypeError);
		});

		test(`forced string enum parses to undefined — key match additionally requires a numeric value`, () => {
			const forced = ColorString as unknown as EnumLike<keyof typeof ColorString, number>;
			expect(parseEnum(forced, "Red")).toBeUndefined();
		});
	});

	describe("Enum", () => {
		test(`Enum.keys/values/parse are the standalone functions (identity)`, () => {
			expect(Enum.keys).toBe(getEnumKeys);
			expect(Enum.values).toBe(getEnumValues);
			expect(Enum.parse).toBe(parseEnum);
		});

		test(`Enum.keys(DayNight) === ["Day","Night"] — inferred, no type args needed`, () => {
			const keys: ("Day" | "Night")[] = Enum.keys(DayNight);
			expect(keys).toEqual(["Day","Night"]);
		});

		test(`Enum.values(DayNight) === [0,1]`, () => {
			const values: DayNight[] = Enum.values(DayNight);
			expect(values).toEqual([0,1]);
		});

		test(`Enum.parse(DayNight, "night") === DayNight.Night`, () => {
			expect(Enum.parse(DayNight, "night")).toBe(DayNight.Night);
		});
	});

});
