import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { SnsTransportOptions } from "../build/index.js";
import { Logger, PinoWrapper } from "../build/index.js";

const spies:{ mockRestore:() => void }[] = [];

afterEach(() => {
	spies.splice(0).forEach(spy => spy.mockRestore());
});

describe("Logger", () => {

	describe("init()/instance singleton", () => {

		test(`the first init() creates the default instance and instance returns it`, () => {
			const logger = Logger.init();
			expect(logger).toBeInstanceOf(Logger);
			expect(Logger.instance).toBe(logger);
		});

		test(`a second init(options) is ignored — the singleton keeps the first initialization`, () => {
			const first = Logger.instance;
			expect(Logger.init({ dev:true })).toBe(first);
		});

		test(`instance and init() are stable across repeated access`, () => {
			expect(Logger.instance).toBe(Logger.instance);
			expect(Logger.init()).toBe(Logger.init());
		});

	});

	describe("levels", () => {

		test(`default level is info when NODE_ENV does not start with "dev" (vitest sets it to "test")`, () => {
			expect(new Logger().pino.level).toBe("info");
		});

		test(`options.dev:true raises the level to trace`, () => {
			expect(new Logger({ dev:true }).pino.level).toBe("trace");
		});

		test(`NODE_ENV starting with "dev" also raises the level to trace`, () => {
			const saved = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";
			try {
				expect(new Logger().pino.level).toBe("trace");
			}finally {
				if (saved === undefined) delete process.env.NODE_ENV;
				else process.env.NODE_ENV = saved;
			}
		});

		test(`QUIRK: options.dev:false does NOT fall back to the env check — ?? only skips nullish, so false wins and stays info`, () => {
			const saved = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";
			try {
				expect(new Logger({ dev:false }).pino.level).toBe("info");
			}finally {
				if (saved === undefined) delete process.env.NODE_ENV;
				else process.env.NODE_ENV = saved;
			}
		});

	});

	describe("package()", () => {

		test(`returns a PinoWrapper child bound with the package name`, () => {
			const logger = Logger.instance;
			const childSpy = vi.spyOn(logger.pino, "child");
			spies.push(childSpy);

			const pkg = logger.package("pkg-a", { extra:1 });
			expect(pkg).toBeInstanceOf(PinoWrapper);
			expect(childSpy).toHaveBeenCalledTimes(1);
			expect(childSpy.mock.calls[0]?.[0]).toEqual({ extra:1, package:"pkg-a" });
		});

		test(`the same packageName returns the identical wrapper and skips pino.child`, () => {
			const logger = Logger.instance;
			const childSpy = vi.spyOn(logger.pino, "child");
			spies.push(childSpy);

			logger.package("pkg-b", { first:1 });
			const second = logger.package("pkg-b", { ignored:2 });
			expect(second).toBe(logger.package("pkg-b"));
			expect(childSpy).toHaveBeenCalledTimes(1); // bindings/options only used the first time
		});

		test(`different packageNames get distinct wrappers`, () => {
			expect(Logger.instance.package("pkg-c")).not.toBe(Logger.instance.package("pkg-d"));
		});

		test(`the static Logger.package() shares the instance's registry`, () => {
			const viaStatic = Logger.package("pkg-e");
			expect(viaStatic).toBeInstanceOf(PinoWrapper);
			expect(Logger.instance.package("pkg-e")).toBe(viaStatic);
		});

	});

	describe("child()", () => {

		test(`instance.child() returns a fresh PinoWrapper per call`, () => {
			const logger = Logger.instance;
			const one = logger.child({ x:1 });
			const two = logger.child({ x:1 });
			expect(one).toBeInstanceOf(PinoWrapper);
			expect(one).not.toBe(two);
		});

		test(`the static Logger.child() delegates to the instance with the bindings untouched`, () => {
			const childSpy = vi.spyOn(Logger.instance.pino, "child");
			spies.push(childSpy);

			Logger.child({ y:2 });
			expect(childSpy).toHaveBeenCalledTimes(1);
			expect(childSpy.mock.calls[0]?.[0]).toEqual({ y:2 }); // no package key added
		});

	});

	describe("logDirPath file output (VITEST=true forces the synchronous -test.log destination)", () => {

		test(`writes <stem>-test.log synchronously and never the plain name`, () => {
			const dir = mkdtempSync(join(tmpdir(), "logger-utils-"));
			new Logger({ logDirPath:dir, logFileName:"probe.log" });

			expect(existsSync(join(dir, "probe-test.log"))).toBe(true);
			expect(existsSync(join(dir, "probe.log"))).toBe(false);
			const content = readFileSync(join(dir, "probe-test.log"), "utf8");
			expect(content).toContain("Logger initialized: pino; sync; file");
		});

		test(`LOG_PATH env is picked up when no logDirPath option is given`, () => {
			const dir = mkdtempSync(join(tmpdir(), "logger-utils-"));
			const saved = process.env.LOG_PATH;
			process.env.LOG_PATH = dir;
			try {
				new Logger({ logFileName:"env-probe.log" });
				expect(existsSync(join(dir, "env-probe-test.log"))).toBe(true);
			}finally {
				if (saved === undefined) delete process.env.LOG_PATH;
				else process.env.LOG_PATH = saved;
			}
		});

		test(`LOG_FILE_NAME env supplies the file name`, () => {
			const dir = mkdtempSync(join(tmpdir(), "logger-utils-"));
			const savedPath = process.env.LOG_PATH;
			const savedName = process.env.LOG_FILE_NAME;
			process.env.LOG_PATH = dir;
			process.env.LOG_FILE_NAME = "custom-name.log";
			try {
				new Logger();
				expect(existsSync(join(dir, "custom-name-test.log"))).toBe(true);
			}finally {
				if (savedPath === undefined) delete process.env.LOG_PATH;
				else process.env.LOG_PATH = savedPath;
				if (savedName === undefined) delete process.env.LOG_FILE_NAME;
				else process.env.LOG_FILE_NAME = savedName;
			}
		});

		test(`QUIRK: logFileName.replace(".log", ...) rewrites the first ".log" anywhere in the name`, () => {
			const dir = mkdtempSync(join(tmpdir(), "logger-utils-"));
			new Logger({ logDirPath:dir, logFileName:"my.logx" });
			// "my.logx" becomes "my-test.logx" — a mid-name ".log" is rewritten too
			expect(existsSync(join(dir, "my-test.logx"))).toBe(true);
		});

	});

	describe("SNS transport wiring", () => {

		test(`an invalid sns.clientConfig is silently skipped (isSnsClientConfig guard) — Logger still initializes`, () => {
			const badConfig = { nope:true } as unknown as SnsTransportOptions["clientConfig"];
			const logger = new Logger({ sns:{ clientConfig:badConfig, subject:"s" } });
			expect(logger).toBeInstanceOf(Logger);
			// no transport target was added; nothing to assert beyond successful construction (real SNS wiring is integration-only)
		});

	});

});
