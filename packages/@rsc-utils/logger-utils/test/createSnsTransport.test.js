import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { Logger } from "../build/index.js";

// this flag avoids spamming SNS running tests
const SNS_ENABLED = false;

/**
 * the actual app has a function in the @rsc-sage/env lib to parse this
 * this test don't have those dependencies, so we manually read and parse the config
 */
async function getSnsClientConfig() {
	// extra safety check
	if (!SNS_ENABLED) return undefined;

	let counter = 3;

	// if we run from rpg-sage root, this path is fine
	let path = "./config/config.json";

	// if we happen to run it from within logger-utils, this loop will fix the path to the config.json
	while (!existsSync(path) && counter--) {
		path = join("..", path);
	}

	try {
		const config = JSON.parse(readFileSync(path).toString());
		const { snsTopicArn, snsRegion, snsAccessKeyId, snsSecretAccessKey } = config.beta.env;
		return {
			topicArn: snsTopicArn,
			region: snsRegion,
			accessKeyId: snsAccessKeyId,
			secretAccessKey: snsSecretAccessKey,
		};

	}catch(err) {
		console.error(err);
		return undefined;
	}
}

async function doTest() {

	const clientConfig = await getSnsClientConfig();
	const subject = `RPG Sage (createSnsTransport.test.js) Logger - {level}`;

	const logger = Logger.init({
		// enable trace/debug
		dev: true,
		// enable SNS for error/fatal
		sns:{ clientConfig, subject }
	});
	logger.info("info(Message Only)");
	logger.info({ a:"A", two:2, big:1n }, "info(Object w/ Message)");
	logger.error(new Error("Test Error"));
	logger.error(new Error("Test Error w/ Message"), "error(Test Error w/ Message)");
	logger.fatal({ a:"A", two:2, big:1n, err:new Error("Test Error in Object") }, "fatal(Test Error in Object)");
	["trace", "debug", "info", "warn", "error", "fatal"].forEach(level => {
		logger[level](level + "()");
		logger.package("logger-utils")[level](level + "()");
	});
	if (SNS_ENABLED) {
		logger.trace("pausing for 1 second");
		await new Promise(res => setTimeout(res, 1000));
	}
}

if (process.argv.some(arg => arg.endsWith("createSnsTransport.test.js"))) {

	doTest();

}else {

	describe("Logger", () => {
		test("createSnsTransport()", async () => {

			await doTest();

			expect(void 0).toBeUndefined();
		});
	});

}