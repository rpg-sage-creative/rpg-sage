import { getLogger, type PinoLogFn } from "@rsc-utils/logger-utils";
import { afterEach, beforeAll, describe, expect, test, vitest } from "vitest";
import { forEach } from "../../build/index.js";

let debug: PinoLogFn;
let trace: PinoLogFn;

beforeAll(() => {
	debug = vitest.spyOn(getLogger(), "debug");
	trace = vitest.spyOn(getLogger(), "trace");
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
		expect(trace).toHaveBeenCalledTimes(11);
	});

	test("PercentLogger (log handler)", () => {
		const array = new Array(100);
		array.fill(1);
		forEach("forEach", array, debug);
		expect(debug).toHaveBeenCalledTimes(100);
		expect(trace).toHaveBeenCalledTimes(11);
	});

});
