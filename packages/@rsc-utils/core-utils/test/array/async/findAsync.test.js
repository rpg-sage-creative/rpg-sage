import { findAsync } from "../../../build/index.js";

function odd(index, ms = 100, ret = true) {
	if (index % 2 == 1) return;
	return new Promise(res => { setTimeout(res, ms, ret); });
}

describe("array", () => {
	describe("async", () => {

		test("findAsync", async () => {
			const input = ["one", "two", "three"];
			const expected = "one";
			const output = await findAsync(input, async (val, index, arr) => odd(index));
			expect(output).toBe(expected);
		});

	});
});