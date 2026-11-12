import { describe, expect, test } from "vitest";
import { isErrorLike } from "../build/index.js";

describe("isErrorLike", () => {

	describe("without a tester arg", () => {

		test(`a real Error is ErrorLike`, () => {
			expect(isErrorLike(new Error(`boom`))).toBe(true);
		});

		test(`a TypeError (subclass) is ErrorLike`, () => {
			expect(isErrorLike(new TypeError(`boom`))).toBe(true);
		});

		test(`a plain object with message and name is ErrorLike`, () => {
			expect(isErrorLike({ message:`m`, name:`n` })).toBe(true);
		});

		test(`missing name is not ErrorLike`, () => {
			expect(isErrorLike({ message:`m` })).toBe(false);
		});

		test(`missing message is not ErrorLike`, () => {
			expect(isErrorLike({ name:`n` })).toBe(false);
		});

		test(`a non-string cause is not ErrorLike`, () => {
			expect(isErrorLike({ message:`m`, name:`n`, cause:`why` })).toBe(false);
		});

		test(`an ErrorLike cause chain is valid`, () => {
			expect(isErrorLike({ message:`m`, name:`n`, cause:{ message:`c`, name:`cn` } })).toBe(true);
		});

		test(`a real Error cause chain is valid`, () => {
			expect(isErrorLike({ message:`m`, name:`n`, cause:new Error(`c`) })).toBe(true);
		});

		test(`an array with error-like props is not ErrorLike (fails the object type check)`, () => {
			expect(isErrorLike(Object.assign([], { message:`m`, name:`n` }))).toBe(false);
		});

		test(`falsy values are not ErrorLike`, () => {
			expect(isErrorLike(null)).toBe(false);
			expect(isErrorLike(undefined)).toBe(false);
			expect(isErrorLike(false)).toBe(false);
		});

		test(`strings and numbers are not ErrorLike`, () => {
			expect(isErrorLike(`boom`)).toBe(false);
			expect(isErrorLike(42)).toBe(false);
		});

	});

	describe("with a string arg", () => {

		test(`matches against the message`, () => {
			expect(isErrorLike(new Error(`boom`), `boom`)).toBe(true);
		});

		test(`matches against the name`, () => {
			expect(isErrorLike(new TypeError(`x`), `TypeError`)).toBe(true);
		});

		test(`no match on message or name is false`, () => {
			expect(isErrorLike(new Error(`boom`), `other`)).toBe(false);
		});

		test(`a non-ErrorLike object never matches`, () => {
			expect(isErrorLike({ message:`boom`, name:42 as unknown as string }, `boom`)).toBe(false);
		});

	});

	describe("with a function tester", () => {

		test(`the tester result is returned`, () => {
			expect(isErrorLike({ message:`m`, name:`Custom` }, err => err.name === `Custom`)).toBe(true);
			expect(isErrorLike({ message:`m`, name:`Custom` }, err => err.name === `Other`)).toBe(false);
		});

		test(`the tester is not called for non-ErrorLike values`, () => {
			let called = false;
			isErrorLike(null, () => { called = true; return true; });
			expect(called).toBe(false);
		});

	});

});
