import { describe, expect, test } from "vitest";
import { omit } from "../build/index.js";

describe("omit", () => {

	const A = { a:"A" };
	const B = { b:"B" };
	const AB = { a:"A", b:"B" };
	const ABC = { a:"A", b:"B", c:"C" };

	test(`omit(A) === A — single-key object copies unchanged`, () => {
		expect(omit(A)).toEqual(A);
	});

	test(`omit(B) === B — single-key object copies unchanged`, () => {
		expect(omit(B)).toEqual(B);
	});

	test(`omit(AB, "a") === { b:"B" }`, () => {
		expect(omit(AB, "a")).toEqual({ b:"B" });
	});

	test(`omit(ABC, "c") === AB`, () => {
		expect(omit(ABC, "c")).toEqual(AB);
	});

	test(`omit(ABC, "a", "c") === { b:"B" } — multiple keys`, () => {
		expect(omit(ABC, "a", "c")).toEqual({ b:"B" });
	});

	test(`omit(ABC, "a", "b", "c") === {} — all keys omitted`, () => {
		expect(omit(ABC, "a", "b", "c")).toEqual({});
	});

	test(`omit(ABC) === ABC — no keys omitted copies everything`, () => {
		expect(omit(ABC)).toEqual(ABC);
	});

	test(`omit({}, "a") === {} on Record<string, string>`, () => {
		const empty: Record<string, string> = {};
		expect(omit(empty, "a")).toEqual({});
	});

	test(`omitted key declared but absent at runtime is a no-op`, () => {
		const obj: { a?: number; missing?: string } = { a:1 };
		expect(omit(obj, "missing")).toEqual({ a:1 });
	});

	test(`result is a NEW object, not the input`, () => {
		const out = omit(ABC, "c");
		expect(out).not.toBe(ABC);
	});

	test(`copy is SHALLOW — nested values keep reference identity`, () => {
		const deep = { x:1 };
		const src = { a:"A", deep };
		const out = omit(src, "a");
		expect(out.deep).toBe(deep);
	});

	test(`omit(null) === null — passthrough`, () => {
		const nulled: { a:string } | null = null;
		expect(omit(nulled)).toBeNull();
	});

	test(`omit(undefined) === undefined — passthrough`, () => {
		const missed: { a:string } | undefined = undefined;
		expect(omit(missed)).toBeUndefined();
	});

});
