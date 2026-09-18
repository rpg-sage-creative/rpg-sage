import { vitest } from "vitest";
import { getLogger, ProgressTracker } from "../../build/index.js";

const error = vitest.spyOn(getLogger(), "error");
const info = vitest.spyOn(getLogger(), "info");
const silly = vitest.spyOn(getLogger(), "silly");
const verbose = vitest.spyOn(getLogger(), "verbose");
// function error(...args) { console.log("error", ...args); _error(...args); }
// function info(...args) { console.log("info", ...args); _info(...args); }
// function silly(...args) { console.log("silly", ...args); _silly(...args); }
// function verbose(...args) { console.log("verbose", ...args); _verbose(...args); }

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
		pLogger.on("increment", eventData => silly(eventData.message));
		pLogger.on("started", eventData => info(eventData.message));
		pLogger.on("status", eventData => verbose(eventData.message));

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
		expect(silly).toHaveBeenCalledTimes(14);
		expect(verbose).toHaveBeenCalledTimes(6); // 0%, 20%, 40%, 60%, 80%, 93%

	});

});
