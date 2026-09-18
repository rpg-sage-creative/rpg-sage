import { wrapSetIterator } from "../build/index.js";

describe("wrapSetIterator", () => {

	const values = ["a","b","c"];
	const valueFn = (value) => {
		return { value, skip:false };
	};

	test(`for ... of`, () => {
		let index = 0;
		const iterator = wrapSetIterator(values, valueFn);
		for (const value of iterator) {
			expect(value).toBe(values[index++]);
		}
	});

	test(`while`, () => {
		let index = 0;
		const iterator = wrapSetIterator(values, valueFn);
		let val;
		do {
			val = iterator.next();
			expect(val.value).toBe(values[index++]);
		}while (!val.done);
	});

});