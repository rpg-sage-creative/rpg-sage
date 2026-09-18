import { wrapMapIterator, wrapSetIterator } from "../build/index.js";

describe("wrapMapIterator", () => {

	const map = { "a":"A", "b":"B", "c":"C", "d":undefined };
	const keys = Object.keys(map);
	const values = Object.values(map);

	const keyFn = key => {
		return { value:key, skip:!(key in map) };
	};
	const valueFn = key => {
		return { value:key, skip:!map[key] };
	};

	test(`key: for ... of`, () => {
		let index = 0;
		const keys = Object.keys(map);
		const iterator = wrapMapIterator(keys, keyFn);
		for (const key of iterator) {
			expect(key).toBe(keys[index]);
			expect(map[key]).toBe(values[index++]);
		}
	});

	test(`value: for ... of`, () => {
		let index = 0;
		const iterator = wrapMapIterator(values, keyFn);
		for (const value of iterator) {
			expect(value).toBe(values[index]);
			expect(value).toBe(map[keys[index++]]);
		}
	});

});