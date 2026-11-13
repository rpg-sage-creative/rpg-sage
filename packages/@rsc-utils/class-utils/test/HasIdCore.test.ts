import { describe, expect, test } from "vitest";
import { HasIdCore } from "../build/index.js";

class HasIdCoreTester extends HasIdCore {
	get [Symbol.toStringTag]() { return "HasIdCoreTester"; }
}

const snowflake = `1234567890123456`;
const uuid = `1b6ace60-64cf-4a52-ab74-db0349655157`;

const hasSnowflakeCore = new HasIdCoreTester({ id:snowflake, objectType:"SnowflakeTester" });
const hasUuidCore = new HasIdCoreTester({ id:uuid, objectType:"UuidTester" });
const hasMultiCore = new HasIdCoreTester({ id:`control`, did:snowflake, uuid:uuid, objectType:"MultiTester" });

describe("HasIdCore", () => {

	describe(`HasIdCore<snowflake>.equals`, () => {

		test(`equals itself === true`, () => {
			expect(hasSnowflakeCore.equals(hasSnowflakeCore)).toBe(true);
		});

		test(`equals its snowflake id string === true`, () => {
			expect(hasSnowflakeCore.equals(snowflake)).toBe(true);
		});

		test(`equals a uuid core === false`, () => {
			expect(hasSnowflakeCore.equals(hasUuidCore)).toBe(false);
		});

		test(`equals a uuid string === false`, () => {
			expect(hasSnowflakeCore.equals(uuid)).toBe(false);
		});

		test(`equals an unrelated id === false`, () => {
			expect(hasSnowflakeCore.equals(`control`)).toBe(false);
		});

		test(`equals null/undefined === false`, () => {
			expect(hasSnowflakeCore.equals(null)).toBe(false);
			expect(hasSnowflakeCore.equals(undefined)).toBe(false);
		});

	});

	describe(`HasIdCore<uuid>.equals`, () => {

		test(`equals a snowflake core === false`, () => {
			expect(hasUuidCore.equals(hasSnowflakeCore)).toBe(false);
		});

		test(`equals a snowflake string === false`, () => {
			expect(hasUuidCore.equals(snowflake)).toBe(false);
		});

		test(`equals itself === true`, () => {
			expect(hasUuidCore.equals(hasUuidCore)).toBe(true);
		});

		test(`equals its uuid id string === true`, () => {
			expect(hasUuidCore.equals(uuid)).toBe(true);
		});

		test(`equals an unrelated id === false`, () => {
			expect(hasUuidCore.equals(`control`)).toBe(false);
		});

		test(`equals null/undefined === false`, () => {
			expect(hasUuidCore.equals(null)).toBe(false);
			expect(hasUuidCore.equals(undefined)).toBe(false);
		});

	});

	describe(`HasIdCore<multi>.equals (deprecated did/uuid holders)`, () => {

		test(`matches a core whose id is one of its deprecated ids === true`, () => {
			expect(hasMultiCore.equals(hasSnowflakeCore)).toBe(true);
			expect(hasMultiCore.equals(hasUuidCore)).toBe(true);
		});

		test(`matches the snowflake/uuid strings of its deprecated ids === true`, () => {
			expect(hasMultiCore.equals(snowflake)).toBe(true);
			expect(hasMultiCore.equals(uuid)).toBe(true);
		});

		test(`known quirk: does not match its own non-id-like id string "control"`, () => {
			expect(hasMultiCore.equals(`control`)).toBe(false);
		});

		test(`equals null/undefined === false`, () => {
			expect(hasMultiCore.equals(null)).toBe(false);
			expect(hasMultiCore.equals(undefined)).toBe(false);
		});

	});

});
