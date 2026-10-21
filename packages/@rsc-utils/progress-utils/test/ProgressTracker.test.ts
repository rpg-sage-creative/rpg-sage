import { Logger, LoggerLike } from "@rsc-utils/logger-utils";
import { afterAll, afterEach, beforeAll, describe, expect, test, vitest } from "vitest";
import { ProgressTracker } from "../build/index.js";

let logger: LoggerLike;

beforeAll(() => {
	logger = Logger.init(
		// { dev:true }
	).spyOn();
});

afterEach(() => {
	// reset counts
	vitest.resetAllMocks();
});

afterAll(() => {
	// restore the spy created with spyOn
	vitest.restoreAllMocks();
});

describe("ProgressTracker", () => {

	test("new ProgressTracker(label, [...15...], 5)", () => {

		const array = new Array(15);
		array.fill(1);

		const tracker = new ProgressTracker("testProgressTracker", array.length, 5);
		tracker.on("error", ({ message }) => logger.error(message));
		tracker.on("finished", ({ message }) => logger.info(message));
		tracker.on("increment", ({ message }) => logger.debug(message));
		tracker.on("started", ({ message }) => logger.info(message));
		tracker.on("status", ({ message }) => logger.trace(message));

		tracker.finish();                        // error++ = 1
		tracker.start();                         // info++  = 1
		array.forEach((value, index, array) => {
			if (!index) tracker.start();         // error++ = 2
			if (index === 14) tracker.finish();  // info++  = 2
			tracker.increment();                 // debug++ = 14 (prev line finishes early); error++ = 3 (increment after finish())
		});
		tracker.finish();                        // error++ = 4
		tracker.start();                         // error++ = 5

		expect(logger.error).toHaveBeenCalledTimes(5);
		expect(logger.info).toHaveBeenCalledTimes(2);
		expect(logger.debug).toHaveBeenCalledTimes(14);
		expect(logger.trace).toHaveBeenCalledTimes(6); // 0%, 20%, 40%, 60%, 80%, 93%

	});

	test("ProgressTracker.withLogger({ label, total:15, increment:5, logger })", () => {

		const array = new Array(15);
		array.fill(1);

		const tracker = ProgressTracker.withLogger({
			label: "testProgressTrackerWithLogger",
			total: array.length,
			interval: 5,
			logger,
			compact: true
		});

		tracker.finish();                        // error++ = 1
		tracker.start();                         // info++  = 1
		array.forEach((value, index, array) => {
			if (!index) tracker.start();         // error++ = 2
			if (index === 14) tracker.finish();  // info++  = 2
			tracker.increment();                 // debug++ = 14 (prev line finishes early); error++ = 3 (increment after finish())
		});
		tracker.finish();                        // error++ = 4
		tracker.start();                         // error++ = 5

		expect(logger.error).toHaveBeenCalledTimes(5);
		expect(logger.info).toHaveBeenCalledTimes(2);
		expect(logger.debug).toHaveBeenCalledTimes(14);
		expect(logger.trace).toHaveBeenCalledTimes(6); // 0%, 20%, 40%, 60%, 80%, 93%

	});

});
