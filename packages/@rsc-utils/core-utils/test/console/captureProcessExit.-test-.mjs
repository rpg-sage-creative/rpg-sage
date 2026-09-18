import { captureProcessExit, enableLogLevels, initializeConsoleUtilsByEnvironment } from "../../build/index.js";

/**
 * this cannot be tested via jest, so we shim describe and test
 * call the test manually with:
 * 		node ./test/console/captureProcessExit.-test-.mjs
 */

var describe, test;
if (!describe) describe = async (key, fn) => { console.log(key); await fn(); };
if (!test) test = describe;

describe("console", () => {
	describe("captureProcessExit", () => {

		test("captureProcessExit", async () => {
			enableLogLevels("dev");

			const destroyable = { destroy:() => console.log("destroyable.destroy()") };
			const notDestroyable = { };
			const signalHandler = () => console.log("signalHandler()");
			captureProcessExit(destroyable);
			captureProcessExit(notDestroyable);
			captureProcessExit(signalHandler);

			console.log("awaiting Ctrl+C ... 3");
			await new Promise(res => setTimeout(res, 1000));
			console.log("awaiting Ctrl+C ... 2");
			await new Promise(res => setTimeout(res, 1000));
			console.log("awaiting Ctrl+C ... 1");
			await new Promise(res => setTimeout(res, 1000));
			console.log("no longer awaiting Ctrl+C");
		});

	});
});
