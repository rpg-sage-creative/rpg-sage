import { filterAsync } from "../../../build/index.js";

function odd(index, ms = 100, ret = true) {
	if (index % 2 == 1) return;
	return new Promise(res => { setTimeout(res, ms, ret); });
}

describe("array", () => {
	describe("async", () => {

		test("filterAsync", async () => {
			const input = ["one", "two", "three"];
			const expected = ["one","three"];
			const output = await filterAsync(input, async (val, index, arr) => odd(index));
			expect(output).toStrictEqual(expected);
		});

	});
});