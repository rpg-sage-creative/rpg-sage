import { Writable } from "node:stream";
import { afterEach, describe, expect, test } from "vitest";
import type { Mock } from "vitest";
import pino from "pino";
import type { LoggerLike } from "../build/index.js";
import { PinoWrapper } from "../build/index.js";

type PinoLine = { [key:string]:unknown; level:number; msg?:string; };

type Captured = { wrapper:PinoWrapper; lines:PinoLine[]; };

function createSink(lines:PinoLine[]) {
	return new Writable({ write(chunk, _enc, cb) {
		lines.push(JSON.parse(String(chunk)));
		cb();
	} });
}

function createCapturingWrapper(level:"trace" | "info" = "trace"): Captured {
	const lines: PinoLine[] = [];
	return { wrapper:new PinoWrapper(pino({ level }, createSink(lines))), lines };
}

describe("PinoWrapper", () => {

	describe("constructor", () => {

		test(`exposes the wrapped pino logger (pino v10 loggers are Pino class instances, not callables)`, () => {
			const lines: PinoLine[] = [];
			const pinoLogger = pino({ level:"trace" }, createSink(lines));
			expect(new PinoWrapper(pinoLogger).pino).toBe(pinoLogger);
		});

	});

	describe("child()", () => {

		test(`returns a fresh PinoWrapper around the pino child`, () => {
			const { wrapper, lines } = createCapturingWrapper();
			const child = wrapper.child({ package:"pkg-x" });
			expect(child).toBeInstanceOf(PinoWrapper);
			expect(child).not.toBe(wrapper);
			child.info("from child");
			expect(lines[0].package).toBe("pkg-x");
		});

		test(`children share the parent destination`, () => {
			const { wrapper, lines } = createCapturingWrapper();
			wrapper.child({ a:1 }).child({ b:2 }).info("nested");
			expect(lines[0]).toMatchObject({ a:1, b:2, msg:"nested" });
		});

	});

	describe("createLogFn()", () => {

		test(`delegates to the named pino handler at its level`, () => {
			const { wrapper, lines } = createCapturingWrapper();
			wrapper.createLogFn("warn")("careful");
			expect(lines[0]).toMatchObject({ level:40, msg:"careful" });
		});

		test(`the returned fn is this-safe (works detached from the instance)`, () => {
			const { wrapper, lines } = createCapturingWrapper();
			const detached = wrapper.createLogFn("error");
			detached("no this needed");
			expect(lines[0]).toMatchObject({ level:50, msg:"no this needed" });
		});

	});

	describe("level methods", () => {

		test(`trace/debug/info/warn/error/fatal write at pino levels 10/20/30/40/50/60`, () => {
			const { wrapper, lines } = createCapturingWrapper();
			wrapper.trace("t");
			wrapper.debug("d");
			wrapper.info("i");
			wrapper.warn("w");
			wrapper.error("e");
			wrapper.fatal("f");
			expect(lines.map(line => line.level)).toEqual([10, 20, 30, 40, 50, 60]);
		});

		test(`all six methods return undefined`, () => {
			const { wrapper } = createCapturingWrapper();
			expect(wrapper.trace("t")).toBeUndefined();
			expect(wrapper.debug("d")).toBeUndefined();
			expect(wrapper.info("i")).toBeUndefined();
			expect(wrapper.warn("w")).toBeUndefined();
			expect(wrapper.error("e")).toBeUndefined();
			expect(wrapper.fatal("f")).toBeUndefined();
		});

		test(`QUIRK: methods below the pino level are dropped by pino, not by the wrapper`, () => {
			const { wrapper, lines } = createCapturingWrapper("info");
			wrapper.trace("dropped");
			wrapper.debug("dropped");
			wrapper.info("kept");
			expect(lines.map(line => line.msg)).toEqual(["kept"]);
		});

	});

	describe("createCatcher()", () => {

		test(`logs the reason at the named handler and returns the given value`, () => {
			const { wrapper, lines } = createCapturingWrapper();
			const catcher = wrapper.createCatcher("error", "FALLBACK");
			expect(catcher(new Error("x"))).toBe("FALLBACK");
			expect(lines[0]).toMatchObject({ level:50, msg:"x" }); // pino uses err.message as the log message
		});

		test(`the returned catcher is this-safe (works detached from the instance)`, () => {
			const { wrapper, lines } = createCapturingWrapper();
			const detached = wrapper.createCatcher("warn", 42);
			expect(detached(new Error("y"))).toBe(42);
			expect(lines[0]).toMatchObject({ level:40, msg:"y" });
		});

	});

	describe("catcher properties", () => {

		test(`errorReturnEmptyArray logs at error and returns []`, () => {
			const { wrapper, lines } = createCapturingWrapper();
			expect(wrapper.errorReturnEmptyArray(new Error("x"))).toEqual([]);
			expect(lines[0].level).toBe(50);
		});

		test(`errorReturnFalse logs at error and returns false`, () => {
			const { wrapper, lines } = createCapturingWrapper();
			expect(wrapper.errorReturnFalse(new Error("x"))).toBe(false);
			expect(lines[0].level).toBe(50);
		});

		test(`errorReturnUndefined logs at error and returns undefined`, () => {
			const { wrapper, lines } = createCapturingWrapper();
			expect(wrapper.errorReturnUndefined(new Error("x"))).toBeUndefined();
			expect(lines[0].level).toBe(50);
		});

		test(`warnReturnUndefined logs at warn and returns undefined`, () => {
			const { wrapper, lines } = createCapturingWrapper();
			expect(wrapper.warnReturnUndefined(new Error("x"))).toBeUndefined();
			expect(lines[0].level).toBe(40);
		});

		test(`the reason object is passed through untouched to pino`, () => {
			const { wrapper, lines } = createCapturingWrapper();
			const err = new Error("exact");
			wrapper.errorReturnUndefined(err);
			expect(lines[0]).toMatchObject({ level:50, err:{ message:"exact" } });
		});

	});

	describe("spyOn()", () => {

		const spies:Mock[] = [];

		afterEach(() => {
			spies.splice(0).forEach(spy => spy.mockRestore());
		});

		// spyOn() is typed as LoggerLike, but every fn it returns IS a vitest Mock at runtime
		function spyOnWrapper(wrapper:PinoWrapper) {
			const spy = wrapper.spyOn();
			Object.values(spy).forEach(fn => spies.push(fn as unknown as Mock));
			return spy as Record<keyof LoggerLike, Mock>;
		}

		test(`returns a LoggerLike whose six fns record calls on the wrapper`, () => {
			const { wrapper } = createCapturingWrapper();
			const spy = spyOnWrapper(wrapper);

			spy.trace("t"); spy.debug("d"); spy.info("i");
			spy.warn("w"); spy.error("e"); spy.fatal("f");

			expect(spy.trace.mock.calls.map((args:unknown[]) => args[0])).toEqual(["t"]);
			expect(spy.info.mock.calls).toHaveLength(1);
			expect(spy.fatal.mock.calls).toHaveLength(1);
		});

		test(`the spies still call through to the real loggers by default`, () => {
			const { wrapper, lines } = createCapturingWrapper();
			const spy = spyOnWrapper(wrapper);

			spy.info("still logs");
			expect(lines[0].msg).toBe("still logs");
		});

		test(`QUIRK: spyOn replaces the methods on the instance itself, not just the returned object`, () => {
			const { wrapper } = createCapturingWrapper();
			const spy = spyOnWrapper(wrapper);

			wrapper.info("via instance");
			expect(spy.info.mock.calls).toHaveLength(1);
		});

	});

});
