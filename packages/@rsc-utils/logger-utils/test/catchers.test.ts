import { afterEach, describe, expect, test, vi } from "vitest";
import { errorReturnEmptyArray, errorReturnFalse, errorReturnUndefined, Logger, warnReturnUndefined } from "../build/index.js";

// these top-level catchers lazily trigger Logger.init() on first use and log through the default instance's pino logger
const spies:{ mockRestore:() => void }[] = [];

afterEach(() => {
	spies.splice(0).forEach(spy => spy.mockRestore());
});

describe("catchers", () => {

	describe("errorReturnEmptyArray()", () => {

		test(`logs the reason to pino.error and returns []`, () => {
			const error = vi.spyOn(Logger.instance.pino, "error");
			spies.push(error);

			const reason = new Error("boom");
			expect(errorReturnEmptyArray(reason)).toEqual([]);
			expect(error).toHaveBeenCalledTimes(1);
			expect(error.mock.calls[0]?.[0]).toBe(reason); // the reason object is passed through untouched
		});

		test(`accepts non-Error reasons`, () => {
			const error = vi.spyOn(Logger.instance.pino, "error");
			spies.push(error);
			expect(errorReturnEmptyArray("oops")).toEqual([]);
			expect(error).toHaveBeenCalledWith("oops");
		});

	});

	describe("errorReturnFalse()", () => {

		test(`logs the reason to pino.error and returns false`, () => {
			const error = vi.spyOn(Logger.instance.pino, "error");
			spies.push(error);

			const reason = new Error("boom");
			expect(errorReturnFalse(reason)).toBe(false);
			expect(error).toHaveBeenCalledTimes(1);
			expect(error.mock.calls[0]?.[0]).toBe(reason);
		});

	});

	describe("errorReturnUndefined()", () => {

		test(`logs the reason to pino.error and returns undefined`, () => {
			const error = vi.spyOn(Logger.instance.pino, "error");
			spies.push(error);

			const reason = new Error("boom");
			expect(errorReturnUndefined(reason)).toBeUndefined();
			expect(error).toHaveBeenCalledTimes(1);
			expect(error.mock.calls[0]?.[0]).toBe(reason);
		});

	});

	describe("warnReturnUndefined()", () => {

		test(`logs the reason to pino.warn (not error) and returns undefined`, () => {
			const warn = vi.spyOn(Logger.instance.pino, "warn");
			const error = vi.spyOn(Logger.instance.pino, "error");
			spies.push(warn, error);

			const reason = new Error("hmm");
			expect(warnReturnUndefined(reason)).toBeUndefined();
			expect(warn).toHaveBeenCalledTimes(1);
			expect(error).not.toHaveBeenCalled();
		});

	});

});
