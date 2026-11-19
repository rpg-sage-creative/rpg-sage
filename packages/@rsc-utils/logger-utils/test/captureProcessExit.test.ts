import { describe, expect, test } from "vitest";
import { captureProcessExit } from "../build/index.js";

// SAFETY: onSignal() always ends in process.exit(), which would kill the vitest worker — these tests only verify listener registration and never emit a signal.
const baseline = process.listenerCount("SIGINT");

describe("captureProcessExit", () => {

	test(`returns undefined`, () => {
		expect(captureProcessExit()).toBeUndefined();
	});

	test(`the first call registers exactly one SIGINT listener`, () => {
		captureProcessExit(); // re-run of the no-arg overload; registration already done above
		expect(process.listenerCount("SIGINT")).toBe(baseline + 1);
	});

	test(`subsequent calls do not stack additional listeners (captured flag is module-level)`, () => {
		const before = process.listenerCount("SIGINT");
		captureProcessExit();
		captureProcessExit(() => {});
		expect(process.listenerCount("SIGINT")).toBe(before);
	});

	test(`a SignalHandler function arg is accepted without extra listeners or errors`, () => {
		let called = false;
		const handler = () => { called = true; };
		expect(() => captureProcessExit(handler)).not.toThrow();
		expect(process.listenerCount("SIGINT")).toBe(baseline + 1);
		// the handler is only invoked by onSignal, which we must not trigger in-process
		expect(called).toBe(false);
	});

	test(`a Destroyable object arg is accepted without extra listeners or errors`, () => {
		let destroyed = false;
		const destroyable = { destroy() { destroyed = true; } };
		expect(() => captureProcessExit(destroyable)).not.toThrow();
		expect(process.listenerCount("SIGINT")).toBe(baseline + 1);
		expect(destroyed).toBe(false);
	});

	test(`QUIRK: an object arg without a destroy() function is silently ignored (no handler, no error)`, () => {
		const before = process.listenerCount("SIGINT");
		expect(() => captureProcessExit({ nope:true } as unknown as { destroy:() => void })).not.toThrow();
		expect(process.listenerCount("SIGINT")).toBe(before);
	});

});
