import { describe } from "node:test";
import { Logger } from "../build/index.js";

describe("Logger", () => {
	test("info()", () => {
		expect(Logger.instance.info("Logger.test.js")).toBeUndefined();
	});
});
