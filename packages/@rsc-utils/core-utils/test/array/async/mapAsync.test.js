import { mapAsync } from "../../../build/index.js";

function odd(index, ms = 100, ret = true) {
	if (index % 2 == 1) return;
	return new Promise(res => { setTimeout(res, ms, ret); });
}

describe("array", () => {
	describe("async", () => {

		test("mapAsync", async () => {
			const input = ["one", "two", "three"];
			const expected = ["ONE-ONE", "TWO-TWO", "THREE-THREE"];
			const output = await mapAsync(input, async (val, index, arr) => {
				await odd(index);
				return `${val}-${val}`.toUpperCase();
			});
			expect(output).toStrictEqual(expected);
		});

	});
});
