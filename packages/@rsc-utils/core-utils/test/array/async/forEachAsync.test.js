import { forEachAsync } from "../../../build/index.js";

function odd(index, ms = 100, ret = true) {
	if (index % 2 == 1) return;
	return new Promise(res => { setTimeout(res, ms, ret); });
}

describe("array", () => {
	describe("async", () => {

		test("forEachAsync", async () => {
			const input = ["one", "two", "three"];
			const expected = ["ONE", "TWO", "THREE"];
			const output = [];
			await forEachAsync(input, async (val, index, arr) => {
				await odd(index);
				output.push(val.toUpperCase());
			});
			expect(output).toStrictEqual(expected);
		});

	});
});
