import { fahrenheitToCelsius } from "../../build/index.js";
import { getTests } from "./data.js";

describe("temperature", () => {
	describe("fahrenheitToCelsius", () => {

		const getPrecision = c => String(c).split(".")[1]?.length ?? 0;
		const tests = getTests();

		tests.forEach(({ c, f }) => {
			const precision = getPrecision(c);
			test(`fahrenheitToCelsius(${f}, ${precision}) === ${c}`, () => {
				expect(fahrenheitToCelsius(f, precision)).toBe(c);
			});
		});

	});
});
