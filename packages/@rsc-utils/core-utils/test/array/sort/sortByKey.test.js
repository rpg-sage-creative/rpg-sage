import { sortByKey } from "../../../build/index.js";

describe("array", () => {
	describe("sortByKey", () => {

		const _input = [
			{ level:0, name:"nick" },
			{ level:2, name:"Zach", tag:"upper" },
			{ level:0, name:"zach" },
			{ level:0, name:"bob" },
			{ level:2, name:"nick" },
			{ level:2, name:"zach", tag:"lower" },
			{ level:2, name:"bob" },
			{ level:1, name:"nick" },
		];

		test(`sortByKey("level")`, () => {
			const input = _input.slice();
			const expected = [
				{ level:0, name:"nick" },
				{ level:0, name:"zach" },
				{ level:0, name:"bob" },
				{ level:1, name:"nick" },
				{ level:2, name:"Zach", tag:"upper" },
				{ level:2, name:"nick" },
				{ level:2, name:"zach", tag:"lower" },
				{ level:2, name:"bob" },
			];
			expect(input).not.toStrictEqual(expected);
			input.sort(sortByKey("level"));
			expect(input).toStrictEqual(expected);
		});

		test(`sortByKey("name")`, () => {
			const input = _input.slice();
			const expected = [
				{ level:0, name:"bob" },
				{ level:2, name:"bob" },
				{ level:0, name:"nick" },
				{ level:2, name:"nick" },
				{ level:1, name:"nick" },
				{ level:2, name:"Zach", tag:"upper" },
				{ level:0, name:"zach" },
				{ level:2, name:"zach", tag:"lower" },
			];
			expect(input).not.toStrictEqual(expected);
			input.sort(sortByKey("name"));
			expect(input).toStrictEqual(expected);
		});

		test(`sortByKey("name", "level")`, () => {
			const input = _input.slice();
			const expected = [
				{ level:0, name:"bob" },
				{ level:2, name:"bob" },
				{ level:0, name:"nick" },
				{ level:1, name:"nick" },
				{ level:2, name:"nick" },
				{ level:0, name:"zach" },
				{ level:2, name:"Zach", tag:"upper" },
				{ level:2, name:"zach", tag:"lower" },
			];
			expect(input).not.toStrictEqual(expected);
			input.sort(sortByKey("name", "level"));
			expect(input).toStrictEqual(expected);
		});

		test(`sortByKey("level", "name")`, () => {
			const input = _input.slice();
			const expected = [
				{ level:0, name:"bob" },
				{ level:0, name:"nick" },
				{ level:0, name:"zach" },
				{ level:1, name:"nick" },
				{ level:2, name:"bob" },
				{ level:2, name:"nick" },
				{ level:2, name:"Zach", tag:"upper" },
				{ level:2, name:"zach", tag:"lower" },
			];
			expect(input).not.toStrictEqual(expected);
			input.sort(sortByKey("level", "name"));
			expect(input).toStrictEqual(expected);
		});

		test(`sortByKey("level", "name", "tag")`, () => {
			const input = _input.slice();
			const expected = [
				{ level:0, name:"bob" },
				{ level:0, name:"nick" },
				{ level:0, name:"zach" },
				{ level:1, name:"nick" },
				{ level:2, name:"bob" },
				{ level:2, name:"nick" },
				{ level:2, name:"zach", tag:"lower" },
				{ level:2, name:"Zach", tag:"upper" },
			];
			expect(input).not.toStrictEqual(expected);
			input.sort(sortByKey("level", "name", "tag"));
			expect(input).toStrictEqual(expected);
		});

	});
});
