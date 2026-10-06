import { join } from "node:path";
import pino, { type ChildLoggerOptions, type Bindings as PinoBindings, type LogFn as PinoLogFn, type Logger as PinoLogger } from "pino";
import pretty from "pino-pretty";

export { type PinoLogFn, type PinoLogger };

const DEFAULT_LOG_FILE_NAME = "rpg-sage.log";
// const DEFAULT_LOG_DIR_NAME = "./logs";

type InitOptions = {
	/** override dev mode; normally only on when NODE_ENV starts with "dev" */
	dev?: boolean;
	/** specifies log path and tells Logger to write to log files; normally Logger writes to console */
	logDirPath?: string;
	/** specifies log fileName; normally repo name (such as "rpg-sage.log") */
	logFileName?: string;
};

function getLogDirPathFromProcess(): string | undefined {
	// if log dir path is in env, use it
	return process.env.LOG_PATH;
}

function getLogFileNameFromProcess(): string | undefined {
	// if log file name is in env, use it
	if (process.env.LOG_FILE_NAME) {
		return process.env.LOG_FILE_NAME;
	}

	// if the package name is in env, use it
	const base = process.env.PNPM_PACKAGE_NAME
		?? process.env.npm_package_name;
	return base ? base + ".log" : undefined;
}

/** Logger class for simplifying pino configuration that includes a default static instance. */
export class Logger {

	/** the default Logger instance */
	static #instance?: Logger;

	/** the pino logger for this instance */
	public readonly pino: PinoLogger;

	/** the pino loggers specific to packages */
	private packages?: { [key: string]: PinoLogger; };

	public constructor(options?: InitOptions) {
		try {
			const isTestMode = process.env.VITEST === "true";
			const isDevEnv = options?.dev ?? process.env.NODE_ENV?.startsWith("dev");

			// we want ALL the logs in dev
			const level = isDevEnv ? "trace" : "info";

			// if we have a log dir, so write all logs to file
			const logDirPath = options?.logDirPath
				?? getLogDirPathFromProcess()
				// ?? DEFAULT_LOG_DIR_NAME
				;

			if (logDirPath) {

				const logFileName = options?.logFileName
					?? getLogFileNameFromProcess()
					?? DEFAULT_LOG_FILE_NAME;

				// test mode implies vitest, which requires a special synchronous transport
				if (isTestMode) {

					const logFilePathTest = join(logDirPath, logFileName.replace(".log", "-test.log"));

					this.pino = pino({ level }, pino.destination({ dest:logFilePathTest, sync:true, mkdir:true }));

					this.pino.info("Logger initialized: pino; sync; file");

				// not test mode, so we can do normal transport(s)
				}else {

					const logFilePath = join(logDirPath, logFileName);

					// create the file transport targets
					const targets: pino.TransportTargetOptions[] = [
						{ target: "pino/file", level, options: { destination:logFilePath, mkdir:true, }, },
					];

					if (isDevEnv) {
						// in dev we should also write to the console for convenience
						targets.push(
							{ target: "pino-pretty", level, options: { colorize:true, ignore:"package", messageFormat:"{if package}{package}:: {end}{msg}", }, },
						);
					}

					// set all default / environment settings here
					this.pino = pino({ level, transport: { targets }, });

					this.pino.info("Logger initialized: pino; async; file; %s", level);

				}

			// we don't have a log dir, so we will just write to console
			}else {

				// test mode implies vitest, which requires a special synchronous transport
				if (isTestMode) {

					// set all default / environment settings here
					this.pino = pino(
						{ level },
						pretty({ sync:true, colorize:true, ignore:"package", messageFormat:"{if package}{package}:: {end}{msg}", })
					);

					this.pino.info("Logger initialized: pino-pretty; sync; console; %s", level);

				// no test mode means a normal async transport
				}else {

					// create the console transport
					const targets: pino.TransportTargetOptions[] = [
						{ target: "pino-pretty", level, options: { colorize:true, ignore:"package", messageFormat:"{if package}{package}:: {end}{msg}", }, },
					];

					// set all default / environment settings here
					this.pino = pino({ level, transport: { targets }, });

					this.pino.info("Logger initialized: pino-pretty; async; console; %s", level);

				}

			}

		}catch(ex: any) {
			console.error("Logger initialization error: pino; " + ex?.message);

			// fallback to a generic setup to avoid more errors
			this.pino = pino();

			this.pino.info("Logger initialized: pino; async; console");
		}

	}

	/** Creates and returns a child of the Logger. */
	public child(bindings: PinoBindings, options?: ChildLoggerOptions): PinoLogger {
		return this.pino.child(bindings, options);
	}

	/**
	 * Gets or creates a child of the Logger using the packageName as the package binding/identifier.
	 * Bindings/options only used the first time when creating the child.
	 */
	public package(packageName: string, bindings?: PinoBindings, options?: ChildLoggerOptions): PinoLogger {
		const packages = this.packages ?? {};
		if (!packages[packageName]) {
			packages[packageName] = this.child({ ...bindings, package:packageName }, options);
			packages[packageName].info("Package Logger initialized");
		}
		return packages[packageName];
	}

	/** Creates and reutrns a child of the default Logger. */
	public static child(bindings: PinoBindings): PinoLogger {
		return Logger.instance.child(bindings);
	}

	/** Initializes the default Logger. */
	public static init(options?: InitOptions): Logger {
		return Logger.#instance ??= new Logger(options);
	}

	/**
	 * Gets or creates a child of default the Logger using the packageName as the package binding/identifier.
	 * Bindings/options only used the first time when creating the child.
	 */
	public static package(packageName: string, bindings?: PinoBindings, options?: ChildLoggerOptions): PinoLogger {
		return Logger.instance.package(packageName, bindings, options);
	}

	/**
	 * Returns an instance of the default Logger.
	 * If it hasn't been initialized then it will be initialized with the default options.
	 */
	public static get instance(): Logger {
		return Logger.init();
	}

	// /** Returns a set of loggers that get initialized only on first use. */
	// public static exportLoggers(packageName?: string) {
	// 	let pkg: PinoLogger;
	// 	const getPkg = () => {
	// 		return pkg ??= packageName
	// 			? Logger.instance.package(packageName)
	// 			: Logger.instance.pino;
	// 	};
	// 	return {
	// 		trace: ((...args: unknown[]) => getPkg().trace(...args as [object, string])) as PinoLogFn,
	// 		debug: ((...args: unknown[]) => getPkg().debug(...args as [object, string])) as PinoLogFn,
	// 		info:  ((...args: unknown[]) => getPkg().info(...args  as [object, string])) as PinoLogFn,
	// 		warn:  ((...args: unknown[]) => getPkg().warn(...args  as [object, string])) as PinoLogFn,
	// 		error: ((...args: unknown[]) => getPkg().error(...args as [object, string])) as PinoLogFn,
	// 		fatal: ((...args: unknown[]) => getPkg().fatal(...args as [object, string])) as PinoLogFn,
	// 	};
	// }
}

// export const {
// 	trace,
// 	debug,
// 	info,
// 	warn,
// 	error,
// 	fatal
// } = Logger.exportLoggers();

/** @deprecated Start using .trace() */
// export const verbose: PinoLogFn = function(...args: unknown[]) {
// 	Logger.instance.pino.trace(...args as [object, string]);
// }

/** @deprecated Figure this out !? */
export const http: PinoLogFn = function(...args: unknown[]) {
	Logger.instance.pino.trace(...args as [object, string]);
}

/** Convenience for Logger.instance.pino.trace() */
export const trace: PinoLogFn = function(...args: unknown[]) {
	Logger.instance.pino.trace(...args as [object, string]);
}

/** Convenience for Logger.instance.pino.debug() */
export const debug: PinoLogFn = function(...args: unknown[]) {
	Logger.instance.pino.debug(...args as [object, string]);
}

/** Convenience for Logger.instance.pino.info() */
export const info: PinoLogFn = function(...args: unknown[]) {
	Logger.instance.pino.info(...args as [object, string]);
}

/** Convenience for Logger.instance.pino.warn() */
export const warn: PinoLogFn = function(...args: unknown[]) {
	Logger.instance.pino.warn(...args as [object, string]);
}

/** Convenience for Logger.instance.pino.error() */
export const error: PinoLogFn = function(...args: unknown[]) {
	Logger.instance.pino.error(...args as [object, string]);
}

/** Convenience for Logger.instance.pino.fatal() */
export const fatal: PinoLogFn = function(...args: unknown[]) {
	Logger.instance.pino.fatal(...args as [object, string]);
}

export function getLogger() {
	return Logger.instance.pino;
}