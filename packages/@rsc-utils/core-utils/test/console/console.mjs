import * as ConsoleUtils from "../../build/console/index.js";
import { formatArg, runTests } from "../../build/index.js";

const logLevels = ["silly", "debug", "verbose", "http", "info", "warn", "error"];

function logEach(text) {
	logLevels.forEach(level => ConsoleUtils[level](text));
}

function enableLogLevel(level) {
	ConsoleUtils.info();
	ConsoleUtils.enableLogLevel(level);
	logEach(`LogLevel enabled: ${level}`);
}
function disableLogLevel(level) {
	ConsoleUtils.info();
	ConsoleUtils.disableLogLevel(level);
	logEach(`LogLevel disabled: ${level}`);
}

function enableEnv(env) {
	ConsoleUtils.info();
	ConsoleUtils.enableLogLevels(env);
	logEach(`LogLevel by environment: ${env}`);
	logLevels.forEach(l => ConsoleUtils.disableLogLevel(l));
}

function enableEach() {
	logLevels.forEach(enableLogLevel);
}
function disableEach() {
	logLevels.forEach(disableLogLevel);
}

// async to allow await testing
runTests(async function test_consoleUtils() {
	// test enabling each log level
	enableEach();

	// test disabling each log level
	disableEach();

	// test environments
	enableEnv("development");
	enableEnv("test");
	enableEnv("production");

	// test createCatcher()
	ConsoleUtils.info();
	ConsoleUtils.enableLogLevel("warn");
	const catcher = ConsoleUtils.createCatcher(ConsoleUtils.warn, false);
	const result = await Promise.reject(new Error("Catcher Test Rejection")).catch(catcher);
	console.assert(result === false, `createCatcher() failed.`);

	// test formatArg()
	ConsoleUtils.warn(ConsoleUtils.formatArg("text message"));
	ConsoleUtils.warn(ConsoleUtils.formatArg(new Error("error message")));

	// test getLogger() ?? <- should this exen get exported?

	// test addLogHandler()
	const addedWarn = (...args) => console.log("added log handler (warn)", ...args);
	ConsoleUtils.addLogHandler("warn", addedWarn);
	ConsoleUtils.warn("testing", "addLogHandler(warn)");
	ConsoleUtils.removeLogHandler("warn", addedWarn);

	// test captureProcessExit()
	ConsoleUtils.captureProcessExit((ev, code) => {
		console.log(`\ntesting captureProcessExit(${ev}, ${code})`);
	});
	// console.log("awaiting Ctrl+C ... 3");
	// await new Promise(res => setTimeout(res, 1000));
	// console.log("awaiting Ctrl+C ... 2");
	// await new Promise(res => setTimeout(res, 1000));
	// console.log("awaiting Ctrl+C ... 1");
	// await new Promise(res => setTimeout(res, 1000));

	ConsoleUtils.enableLogLevels("development");

	ConsoleUtils.debug(formatArg({ bigInt:1n }));
});