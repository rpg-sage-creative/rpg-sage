import { describe as _describe, test as _test, type SuiteFactory, type TestFunction } from "vitest";
import { tagLiterals } from "../literals/tagLiterals.js";
import type { Options as LiteralOptions } from "../literals/toLiteral.js";

/**
 * Convenience method for calling vitest functions and tagLiterals together.
 * Example (Old): describe(tagLiterals`Run ${count} tests using ${object}`, () => {})
 * Example (New): describe`Run ${count} tests using ${object}`(() => {})
 */
export function describe(arg: LiteralOptions | TemplateStringsArray, ...args: unknown[]) {
	const description = tagLiterals(arg as TemplateStringsArray, ...args);
	return (fn: SuiteFactory<any>, options?: number) => { _describe(description, fn, options); }
}

/**
 * Convenience method for calling vitest functions and tagLiterals together.
 * Example (Old): describe(tagLiterals`Run ${count} tests using ${object}`, () => {})
 * Example (New): describe`Run ${count} tests using ${object}`(() => {})
 */
export function test(arg: LiteralOptions | TemplateStringsArray, ...args: unknown[]) {
	const description = tagLiterals(arg as TemplateStringsArray, ...args);
	return (fn: TestFunction, options?: number) => { _test(description, fn, options); }
}