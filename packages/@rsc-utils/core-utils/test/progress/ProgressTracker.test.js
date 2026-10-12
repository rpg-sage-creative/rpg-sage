import { vitest } from "vitest";
import { Logger, ProgressTracker } from "../../build/index.js";

const error = vitest.spyOn(Logger.instance, "error");
const info = vitest.spyOn(Logger.instance, "info");
const debug = vitest.spyOn(Logger.instance, "debug");
const trace = vitest.spyOn(Logger.instance, "trace");

afterEach(() => {
	// restore the spy created with spyOn
	vitest.restoreAllMocks();
});

describe("progress", () => {

	test("ProgressTracker", () => {

		const array = new Array(15);
		array.fill(1);

		const pLogger = new ProgressTracker("testProgressTracker", array.length, 5);
		pLogger.on("error", eventData => error(eventData.message));
		pLogger.on("finished", eventData => info(eventData.message));
		pLogger.on("increment", eventData => debug(eventData.message));
		pLogger.on("started", eventData => info(eventData.message));
		pLogger.on("status", eventData => trace(eventData.message));

		pLogger.finish();                        // error++ = 1
		pLogger.start();                         // info++  = 1
		array.forEach((value, index, array) => {
			if (!index) pLogger.start();         // error++ = 2
			if (index === 14) pLogger.finish();  // info++  = 2
			pLogger.increment();                 // silly++ = 14 (prev line finishes early); error++ = 3 (increment after finish())
		});
		pLogger.finish();                        // error++ = 4
		pLogger.start();                         // error++ = 5

		expect(error).toHaveBeenCalledTimes(5);
		expect(info).toHaveBeenCalledTimes(2);
		expect(debug).toHaveBeenCalledTimes(14);
		expect(trace).toHaveBeenCalledTimes(6); // 0%, 20%, 40%, 60%, 80%, 93%

	});

});
