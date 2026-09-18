import { vitest } from "vitest";
import { forEach, getLogger } from "../../build/index.js";

const debug = vitest.spyOn(getLogger(), "debug");
const verbose = vitest.spyOn(getLogger(), "verbose");

afterEach(() => {
	// restore the spy created with spyOn
	vitest.restoreAllMocks();
});

describe("progress", () => {

	test("PercentLogger (empty handler)", () => {
		const array = new Array(100);
		array.fill(1);
		forEach("forEach", array, () => { });
		expect(verbose).toHaveBeenCalledTimes(11);
	});

	test("PercentLogger (log handler)", () => {
		const array = new Array(100);
		array.fill(1);
		forEach("forEach", array, debug);
		expect(debug).toHaveBeenCalledTimes(100);
		expect(verbose).toHaveBeenCalledTimes(11);
	});

});
