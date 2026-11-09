import { celsiusToFahrenheit } from "../../build/index.js";
import { getTests } from "./data.js";

describe("temperature", () => {
	describe("celsiusToFahrenheit", () => {

		const getPrecision = f => String(f).split(".")[1]?.length;
		const tests = getTests();

		tests.forEach(({ c, f }) => {
			const precision = getPrecision(f);
			test(`celsiusToFahrenheit(${c}, ${precision}) === ${f}`, () => {
				expect(celsiusToFahrenheit(c, precision)).toBe(f);
			});
		});

	});
});
