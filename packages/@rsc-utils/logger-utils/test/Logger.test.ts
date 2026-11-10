import { describe, test, expect, beforeAll } from "vitest";
import { Logger } from "../build/index.js";

beforeAll(() => {
	Logger.init({ dev:true });
});

describe("Logger", () => {
	test("info()", () => {
		expect(Logger.instance.trace("Logger.test.js")).toBeUndefined();
		expect(Logger.instance.info("Logger.test.js")).toBeUndefined();
	});
});
