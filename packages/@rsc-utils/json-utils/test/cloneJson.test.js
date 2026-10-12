import { isDate } from "node:util/types";
import { cleanJson, cloneJson } from "../build/index.js";
import { getTests } from "./data.js";

function isPrimitive(object) {
	return object === null
		|| object === undefined
		|| isDate(object)
		|| ["bigint", "boolean", "number", "string"].includes(typeof(object));
}

describe("json", () => {
	describe("cloneJson", () => {

		/** @type {{ object:object; string:string; label:string; }[]} */
		const tests = getTests("cloneJson");

		tests.forEach(({ object, label }) => {
			test(`cloneJson(${label}) equals ${label}`, () => {
				// this does the cloning
				const cloned = cloneJson(object);

				// this removes the keys with undefined from the original
				const cleaned = cleanJson(object);

				// same data
				expect(cloned).toEqual(cleaned);

				// different object
				if (!isPrimitive(object)) {
					expect(cloned).not.toBe(cleaned);
				}
			});
		});

	});
});
