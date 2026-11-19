import { afterEach, describe, expect, test, vi } from "vitest";
import { debug, error, fatal, info, Logger, trace, warn } from "../build/index.js";

// these top-level loggers lazily trigger Logger.init() on first use and delegate to the default instance's pino logger
const spies:{ mockRestore:() => void }[] = [];

afterEach(() => {
	spies.splice(0).forEach(spy => spy.mockRestore());
});

describe("loggers", () => {

	test(`trace() delegates to Logger.instance.pino.trace with the same args`, () => {
		const spy = vi.spyOn(Logger.instance.pino, "trace");
		spies.push(spy);
		expect(trace("t %s", "arg")).toBeUndefined();
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy.mock.calls[0]).toEqual(["t %s", "arg"]);
	});

	test(`debug() delegates to Logger.instance.pino.debug with the same args`, () => {
		const spy = vi.spyOn(Logger.instance.pino, "debug");
		spies.push(spy);
		expect(debug("d")).toBeUndefined();
		expect(spy).toHaveBeenCalledWith("d");
	});

	test(`info() delegates to Logger.instance.pino.info with the same args`, () => {
		const spy = vi.spyOn(Logger.instance.pino, "info");
		spies.push(spy);
		expect(info({ a:1 }, "i")).toBeUndefined();
		expect(spy).toHaveBeenCalledWith({ a:1 }, "i");
	});

	test(`warn() delegates to Logger.instance.pino.warn with the same args`, () => {
		const spy = vi.spyOn(Logger.instance.pino, "warn");
		spies.push(spy);
		expect(warn("w")).toBeUndefined();
		expect(spy).toHaveBeenCalledWith("w");
	});

	test(`error() delegates to Logger.instance.pino.error with the same args`, () => {
		const spy = vi.spyOn(Logger.instance.pino, "error");
		spies.push(spy);
		expect(error(new Error("e"))).toBeUndefined();
		expect(spy.mock.calls[0]?.[0]).toBeInstanceOf(Error);
	});

	test(`fatal() delegates to Logger.instance.pino.fatal with the same args`, () => {
		const spy = vi.spyOn(Logger.instance.pino, "fatal");
		spies.push(spy);
		expect(fatal("f")).toBeUndefined();
		expect(spy).toHaveBeenCalledWith("f");
	});

	test(`no-arg calls pass through as an empty args list (pino's LogFn type requires one arg; the wrapper accepts zero at runtime)`, () => {
		const spy = vi.spyOn(Logger.instance.pino, "info");
		spies.push(spy);
		(info as () => void)();
		expect(spy.mock.calls[0]).toEqual([]);
	});

});
