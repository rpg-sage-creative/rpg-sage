import { describe, expect, test } from "vitest";
import { deepFreeze } from "../build/index.js";

describe("deepFreeze", () => {

	test(`returns the SAME object reference`, () => {
		const input = { a:1 };
		expect(deepFreeze(input)).toBe(input);
	});

	test(`freezes the top-level object`, () => {
		const input = { a:1 };
		deepFreeze(input);
		expect(Object.isFrozen(input)).toBe(true);
	});

	test(`freezes nested objects recursively`, () => {
		const inner = { x:1 };
		const input = { inner };
		deepFreeze(input);
		expect(Object.isFrozen(inner)).toBe(true);
	});

	test(`freezes arrays and their elements`, () => {
		const element = { e:1 };
		const input = { list:[element] };
		deepFreeze(input);
		expect(Object.isFrozen(input.list)).toBe(true);
		expect(Object.isFrozen(element)).toBe(true);
	});

	test(`freezes the same nested object reached through two paths`, () => {
		const shared = { s:1 };
		const input = { one:shared, two:shared };
		deepFreeze(input);
		expect(Object.isFrozen(shared)).toBe(true);
	});

	// Date is typeof "object", so it gets frozen too (src @todo questions this design).
	test(`freezes Date values`, () => {
		const when = new Date(0);
		deepFreeze({ when });
		expect(Object.isFrozen(when)).toBe(true);
	});

	test(`freezes function properties — assigning new props throws in strict mode`, () => {
		const fn = () => 1;
		const input = { fn };
		deepFreeze(input);
		expect(Object.isFrozen(fn)).toBe(true);
		expect(() => (fn as unknown as { zzz:number }).zzz = 1).toThrow(TypeError);
	});

	test(`circular references do not hang or throw — the WeakSet guard stops recursion`, () => {
		const input: { self?: unknown; inner?: Record<string, unknown> } = {};
		input.self = input;
		input.inner = { parent:undefined };
		input.inner.parent = input;
		expect(() => deepFreeze(input)).not.toThrow();
		expect(Object.isFrozen(input)).toBe(true);
		expect(Object.isFrozen(input.inner)).toBe(true);
	});

	test(`frozen objects reject mutation`, () => {
		const input:{ a?: number } = { a:1 };
		deepFreeze(input);
		expect(() => input.a = 2).toThrow(TypeError);
	});

	test(`re-freezing an already frozen object is a no-op and returns it`, () => {
		const input = { a:1 };
		deepFreeze(deepFreeze(input));
		expect(Object.isFrozen(input)).toBe(true);
	});

	// QUIRK: the canFreeze guard makes runtime primitives pass straight through, though the signature rejects them.
	test(`primitive inputs pass through untouched at runtime`, () => {
		// @ts-expect-error — T extends object rejects primitives; the runtime guard tolerates them anyway.
		expect(deepFreeze(5)).toBe(5);
	});

});
