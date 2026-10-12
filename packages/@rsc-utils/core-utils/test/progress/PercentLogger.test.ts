import { Logger } from "@rsc-utils/logger-utils";
import type { LogFn } from "pino";
import { afterEach, beforeAll, describe, expect, test, vitest } from "vitest";
import { forEach } from "../../build/index.js";

let debugSpy: LogFn;
let traceSpy: LogFn;

beforeAll(() => {
	const logger = Logger.init({ dev:true });
	// const { debug, trace } = Logger.init({ dev:true });
	debugSpy = vitest.spyOn(logger, "debug");
	traceSpy = vitest.spyOn(logger, "trace");
});

afterEach(() => {
	// restore the spy created with spyOn
	vitest.restoreAllMocks();
});

describe("progress", () => {

	test("PercentLogger (empty handler)", () => {
		const array = new Array(100);
		array.fill(1);
		forEach("forEach", array, () => { });
		expect(traceSpy).toHaveBeenCalledTimes(11);
	});

	test("PercentLogger (log handler)", () => {
		const array = new Array(100);
		array.fill(1);
		forEach("forEach", array, debugSpy);
		expect(debugSpy).toHaveBeenCalledTimes(100);
		expect(traceSpy).toHaveBeenCalledTimes(11);
	});

});
