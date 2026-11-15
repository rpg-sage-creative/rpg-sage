import { describe, expect, test } from "vitest";
import { PipedContentRegExp } from "../build/index.js";

describe("PipedContentRegExp", () => {

	describe("matches piped content ||content||", () => {

		test(`basic match`, () => {
			expect(PipedContentRegExp.exec(`||abc||`)?.[0]).toBe(`||abc||`);
		});

		test(`newlines are allowed in the content`, () => {
			expect(PipedContentRegExp.exec(`||a\nb||`)?.[0]).toBe(`||a\nb||`);
		});

		test(`matches substrings anywhere — not anchored`, () => {
			expect(PipedContentRegExp.exec(`x ||a|| y`)?.[0]).toBe(`||a||`);
		});

	});

	describe("content is required and lazy", () => {

		test(`empty content |||| does not match`, () => {
			expect(PipedContentRegExp.exec(`||||`)).toBeNull();
		});

		test(`lazy quantifier stops at the first closing pair: ||a||||b|| → "||a||"`, () => {
			expect(PipedContentRegExp.exec(`||a||||b||`)?.[0]).toBe(`||a||`);
		});

	});

	describe("escaped pipes break both ends", () => {

		test(`escaped opening \\||a|| does not match`, () => {
			expect(PipedContentRegExp.exec(`\\||a||`)).toBeNull();
		});

		test(`escaped closing ||a\\|| does not match`, () => {
			expect(PipedContentRegExp.exec(`||a\\||`)).toBeNull();
		});

	});

});
