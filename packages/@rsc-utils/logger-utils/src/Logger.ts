import { isSnsClientConfig } from "@rsc-utils/aws-utils";
import { join } from "node:path";
import pino, { type ChildLoggerOptions, type Bindings as PinoBindings, type Logger as PinoLogger } from "pino";
import pretty from "pino-pretty";
import { PinoWrapper } from "./PinoWrapper.js";
import type { SnsTransportOptions } from "./createSnsTransport.js";

const DEFAULT_LOG_FILE_NAME = "rpg-sage.log";
// const DEFAULT_LOG_DIR_NAME = "./logs";

type InitOptions = {
	/** override dev mode; normally only on when NODE_ENV starts with "dev" */
	dev?: boolean;

	/** specifies log path and tells Logger to write to log files; normally Logger writes to console */
	logDirPath?: string;

	/** specifies log fileName; normally repo name (such as "rpg-sage.log") */
	logFileName?: string;

	sns?: SnsTransportOptions;
};

/*

/** Attempts to send the errors/args via SNS before falling back to sendToSuperUser (Discord DM). *-/
async function notifyViaSns(...args: unknown[]): Promise<void> {
	// check the sns flag
	if (ActiveBot.sns) {
		const clientConfig = getSnsClientConfig();
		if (clientConfig) {
			// prep content
			const subject = `RPG Sage Error - ${getCodeName()}`;
			const content = args.map(formatArg).join("\n");

			// attemp to notify via sns
			const notifyResults = await sendSns({ clientConfig, content, subject }).catch(ex => {
				notifyViaDm("SNS Error", ex);
				return false;
			});

			// a successful sns means we are done
			if (notifyResults) return;
		}

		// a single failure stops sending to sns to avoid a cascade of failures
		ActiveBot.sns = false;
	}

	// fallback to discord dm
	notifyViaDm(`# error`, ...args);
}
*/

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

function initializePino(options?: InitOptions) {
	let pinoLogger: PinoLogger;
	try {
		const isTestMode = process.env.VITEST === "true";
		const isDevEnv = options?.dev
			?? process.env.NODE_ENV?.startsWith("dev")
			?? process.argv.includes("codeName=dev");

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

				pinoLogger = pino({ level }, pino.destination({ dest:logFilePathTest, sync:true, mkdir:true }));

				pinoLogger.info("Logger initialized: pino; sync; file");

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

				// if we have sns config, create a transport target for it
				if (isSnsClientConfig(options?.sns?.clientConfig)) {
					targets.push({ target:"./createSnsTransport.js", level:"error", options:options.sns });
				}

				// set all default / environment settings here
				pinoLogger = pino({ level, transport: { targets }, });

				pinoLogger.info("Logger initialized: pino; async; file; %s", level);

			}

		// we don't have a log dir, so we will just write to console
		}else {

			// test mode implies vitest, which requires a special synchronous transport
			if (isTestMode) {

				// if we have sns config, create a transport target for it
				const transport = isSnsClientConfig(options?.sns?.clientConfig)
					? { targets:[{ target:"./createSnsTransport.js", level:"error", options:options.sns }] }
					: undefined;

				// set all default / environment settings here
				pinoLogger = pino(
					{ level, transport },
					// the pretty streams below is only used if the transport above is undefined
					pretty({ sync:true, colorize:true, ignore:"hostname,package,pid", messageFormat:"{if package}{package}:: {end}{msg}", })
				);

				pinoLogger.info("Logger initialized: pino-pretty; sync; console; %s", level);

			// no test mode means a normal async transport
			}else {

				// create the console transport
				const targets: pino.TransportTargetOptions[] = [
					{ target: "pino-pretty", level, options: { colorize:true, ignore:"package", messageFormat:"{if package}{package}:: {end}{msg}", }, },
				];

				// if we have sns config, create a transport target for it
				if (isSnsClientConfig(options?.sns?.clientConfig)) {
					targets.push({ target:"./createSnsTransport.js", level:"error", options:options.sns });
				}

				// set all default / environment settings here
				pinoLogger = pino({ level, transport: { targets }, });

				pinoLogger.info("Logger initialized: pino-pretty; async; console; %s; %d transports", level, targets.length);

			}

		}

	}catch(ex: any) {
		console.error("Logger initialization error: pino; " + ex?.message);

		// fallback to a generic setup to avoid more errors
		pinoLogger = pino();

		pinoLogger.info("Logger initialized: pino; async; console");
	}
	return pinoLogger;
}

/** Logger class for simplifying pino configuration that includes a default static instance. */
export class Logger extends PinoWrapper {

	/** the default Logger instance */
	static #instance?: Logger;

	/** the pino loggers specific to packages */
	private packages?: { [key: string]: PinoWrapper; };

	public constructor(options?: InitOptions) {
		super(initializePino(options));
	}

	/**
	 * Gets or creates a child of the Logger using the packageName as the package binding/identifier.
	 * Bindings/options only used the first time when creating the child.
	 */
	public package(packageName: string, bindings?: PinoBindings, options?: ChildLoggerOptions): PinoWrapper {
		const packages = this.packages ??= {};
		if (!packages[packageName]) {
			packages[packageName] = this.child({ ...bindings, package:packageName }, options);
			packages[packageName].info("Package Logger initialized");
		}
		return packages[packageName];
	}

	/**
	 * Returns an instance of the default Logger.
	 * If it hasn't been initialized then it will be initialized with the default options.
	 */
	public static get instance(): Logger {
		return Logger.init();
	}

	/** Creates and returns a child of the default Logger. */
	public static child(bindings: PinoBindings): PinoWrapper {
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
	public static package(packageName: string, bindings?: PinoBindings, options?: ChildLoggerOptions): PinoWrapper {
		return Logger.instance.package(packageName, bindings, options);
	}

}
