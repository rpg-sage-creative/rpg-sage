import { tokenize } from "../../build/index.js";

describe("string", () => {
	describe("tokenize", () => {

		const tests = [
			{
				input: "this is text.",
				parsers: { word:/\w+/, whitespace:/\s+/, punctuation:/[^\w\s]/ },
				defToken: "invalid",
				expected: [
					{ key:"word", groups:{}, matches:[], token:"this" },
					{ key:"whitespace", groups:{}, matches:[], token:" " },
					{ key:"word", groups:{}, matches:[], token:"is" },
					{ key:"whitespace", groups:{}, matches:[], token:" " },
					{ key:"word", groups:{}, matches:[], token:"text" },
					{ key:"punctuation", groups:{}, matches:[], token:"." },
				]
			},
			{
				input: "hi first.last!",
				parsers: { firstDotLast:/(?<first>\w+)\.(?<last>\w+)/, word:/\w+/, whitespace:/\s+/, punctuation:/[^\w\s]/ },
				defToken: "invalid",
				expected: [
					{ key:"word", groups:{}, matches:[], token:"hi" },
					{ key:"whitespace", groups:{}, matches:[], token:" " },
					{ key:"firstDotLast", groups:{first:"first",last:"last"}, matches:["first", "last"], token:"first.last" },
					{ key:"punctuation", groups:{}, matches:[], token:"!" },
				]
			},
		];

		tests.forEach(({ input, parsers, defToken, expected }) => {
			test(`tokenize(${input})`, () => {
				expect(tokenize(input, parsers, defToken)).toStrictEqual(expected);
			});
		});

	});
});
