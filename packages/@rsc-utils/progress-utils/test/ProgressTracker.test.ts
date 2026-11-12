import { Logger, LoggerLike } from "@rsc-utils/logger-utils";
import { afterAll, afterEach, beforeAll, describe, expect, test, vitest } from "vitest";
import { ProgressTracker } from "../build/index.js";

let logger: LoggerLike;

beforeAll(() => {
	logger = Logger.init(
		{ dev:true }
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
		tracker.on("increment", ({ message }) => logger.trace(message));
		tracker.on("started", ({ message }) => logger.debug(message));
		tracker.on("status", ({ message }) => logger.info(message));
		tracker.on("finished", ({ message }) => logger.warn(message));
		tracker.on("error", ({ message }) => logger.error(message));

		tracker.finish();                        // error++ = 1
		tracker.start();                         // debug++ = 1
		array.forEach((value, index, array) => {
			if (!index) tracker.start();         // error++ = 2
			if (index === 14) tracker.finish();  // warn++  = 1
			tracker.increment();                 // trace++ = 14 (prev line finishes early); error++ = 3 (increment after finish())
		});
		tracker.finish();                        // error++ = 4
		tracker.start();                         // error++ = 5

		expect(logger.trace).toHaveBeenCalledTimes(14); // we only successfully incremented 14 times
		expect(logger.debug).toHaveBeenCalledTimes(1);
		expect(logger.info).toHaveBeenCalledTimes(6); // 0%, 20%, 40%, 60%, 80%, 93%
		expect(logger.warn).toHaveBeenCalledTimes(1);
		expect(logger.error).toHaveBeenCalledTimes(5);

	});

	test("new ProgressTracker(label, [...1500...], 5)", () => {

		const array = new Array(1500);
		array.fill(1);

		const tracker = new ProgressTracker("testProgressTracker", array.length, 5);
		// tracker.on("increment", ({ message }) => logger.trace(message));
		tracker.on("status", ({ message }) => logger.info(message));
		tracker.on("error", ({ message }) => logger.error(message));

		array.forEach(() => tracker.increment());
		tracker.finish();                        // error++ = 4

		expect(logger.info).toHaveBeenCalledTimes(21); // 0%, 5%, 10% ... 95%, 100%
		expect(logger.error).toHaveBeenCalledTimes(0);

	});

	test("ProgressTracker.withLogger({ label, total:15, interval:5, logger })", () => {
		const array = new Array(15);
		array.fill(1);

		const tracker = ProgressTracker.withLogger({
			label: "testProgressTrackerWithLogger",
			total: array.length,
			interval: 5,
			logger,
			compact: true,
			verbose: true,
		});

		tracker.finish();                        // error++ = 1
		tracker.start();                         // info++  = 1
		array.forEach((value, index, array) => {
			if (!index) tracker.start();         // error++ = 2
			if (index === 14) tracker.finish();  // info++  = 2
			tracker.increment();                 // trace++ = 14 (prev line finishes early); error++ = 3 (increment after finish())
			                                     // withLogger only registers increment() via interval: info += 6
		});
		tracker.finish();                        // error++ = 4
		tracker.start();                         // error++ = 5

		expect(logger.trace).toHaveBeenCalledTimes(14);
		expect(logger.debug).toHaveBeenCalledTimes(0);
		expect(logger.info).toHaveBeenCalledTimes(8); // start, 0%, 20%, 40%, 60%, 80%, 93%, finish
		expect(logger.warn).toHaveBeenCalledTimes(0);
		expect(logger.error).toHaveBeenCalledTimes(5);
		expect(logger.fatal).toHaveBeenCalledTimes(0);

	});

	describe("constructor and defaults", () => {

		test(`totalWithCommas formats with thousands separators`, () => {
			expect(new ProgressTracker("t", 1500).totalWithCommas).toBe("1,500");
		});

		test(`interval defaults to 10`, () => {
			expect(new ProgressTracker("t", 10).interval).toBe(10);
		});

		test(`zero/negative total and interval are ignored`, () => {
			const tracker = new ProgressTracker("t", 0, -5);
			expect(tracker.total).toBe(0);
			expect(tracker.interval).toBe(10);
		});

	});

	describe("messages and lifecycle events", () => {

		test(`status before start reports "Not Started!"`, () => {
			const messages: string[] = [];
			new ProgressTracker({ label:"L", total:10 }).on("status", ({ message }) => messages.push(message)).status();
			expect(messages).toEqual([`L status ... Not Started!`]);
		});

		test(`error() without a message reports "Error!"`, () => {
			const messages: string[] = [];
			new ProgressTracker({ label:"L", total:10 }).on("error", ({ message }) => messages.push(message)).error();
			expect(messages).toEqual([`L (10) ... Error: Error!`]);
		});

		test(`error(message) includes the given message`, () => {
			const messages: string[] = [];
			new ProgressTracker({ label:"L", total:10 }).on("error", ({ message }) => messages.push(message)).error(`boom`);
			expect(messages).toEqual([`L (10) ... Error: Error: boom`]);
		});

		test(`finish reports the actual percent unless force100 is given`, () => {
			const statuses: string[] = [];
			const tracker = new ProgressTracker({ label:"L", total:15 });
			tracker.on("status", ({ message }) => statuses.push(message));
			for (let i = 0; i < 14; i++) tracker.increment();
			tracker.finish();
			expect(statuses.at(-1)).toBe(`L (15) ... 93%`);

			const forced: string[] = [];
			const tracker2 = new ProgressTracker({ label:"L", total:15 });
			tracker2.on("status", ({ message }) => forced.push(message));
			for (let i = 0; i < 14; i++) tracker2.increment();
			tracker2.finish(true);
			expect(forced.at(-1)).toBe(`L (15) ... 100%`);
		});

		test(`duplicate identical handlers are only registered once`, () => {
			let hits = 0;
			const handler = () => hits++;
			const tracker = new ProgressTracker({ label:"L", total:1 });
			tracker.on("started", handler).on("started", handler);
			tracker.start();
			expect(hits).toBe(1);
		});

		test(`withEvents wires up all five event handlers`, () => {
			const error = vitest.fn(), finished = vitest.fn(), increment = vitest.fn(), started = vitest.fn(), status = vitest.fn();
			const events = ProgressTracker.withEvents({ label:"we", total:1, error, finished, increment, started, status });
			events.start();      // started + 0% status
			events.increment();  // increment event; percent hits 100 so a 100% status is reported
			events.finish();     // last interval was already 100, so only the finished event fires
			expect(started).toHaveBeenCalledTimes(1);
			expect(increment).toHaveBeenCalledTimes(1);
			expect(status).toHaveBeenCalledTimes(2);
			expect(finished).toHaveBeenCalledTimes(1);
			expect(error).toHaveBeenCalledTimes(0);
		});

	});

	describe("logger integration", () => {

		test(`compact logger calls receive only the message`, () => {
			const info = vitest.fn();
			ProgressTracker.withLogger({ label:"L", total:1, logger:{ info }, compact:true }).start();
			expect(info).toHaveBeenCalledWith(`L Started.`);
		});

		test(`non-compact logger calls receive the tracker state and message`, () => {
			const info = vitest.fn();
			ProgressTracker.withLogger({ label:"L", total:1, logger:{ info } }).start();
			expect(info).toHaveBeenCalledWith(expect.objectContaining({ countComplete:0, finished:false, interval:10, label:"L", percentComplete:0, started:true, total:1 }), `L Started.`);
		});

		test(`increment events go to logger.trace only when verbose`, () => {
			const trace = vitest.fn();
			const tracker = ProgressTracker.withLogger({ label:"L", total:2, logger:{ trace }, compact:true });
			tracker.increment();
			expect(trace).toHaveBeenCalledTimes(0);

			const verboseTrace = vitest.fn();
			const verbose = ProgressTracker.withLogger({ label:"L", total:2, logger:{ trace:verboseTrace }, compact:true, verbose:true });
			verbose.increment();
			expect(verboseTrace).toHaveBeenCalledTimes(1);
		});

	});

});
