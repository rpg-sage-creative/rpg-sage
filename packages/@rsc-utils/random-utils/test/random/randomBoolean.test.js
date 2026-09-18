import { randomBoolean } from "../../build/index.js";

describe("random", () => {
	describe("randomBoolean", () => {
		test(`[true,false].includes(randomBoolean())`, () => {
			const boolSet = new Set();
			for (let i = 0; i < 1000; i++) {
				const bool = randomBoolean();
				boolSet.add(bool);
				expect([true,false].includes(bool)).toBe(true);
			}
			expect([...boolSet.values()].sort()).toEqual([false,true]);
		});
		test.todo("test.todo")
	});
});