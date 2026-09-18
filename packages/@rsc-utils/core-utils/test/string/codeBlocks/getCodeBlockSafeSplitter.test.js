import { getCodeBlockSafeSplitter, tagLiterals } from "../../../build/index.js";

describe("string", () => {
	describe("codeBlocks", () => {
		describe("getCodeBlockSafeSplitter", () => {

			// const splitter = getCodeBlockSafeSplitter(/\n/);
			const splitter = getCodeBlockSafeSplitter("\n");

			const tests = [
				{ input:"first\nsecond\nthird\nfourth\nfifth", limit:3, expected:["first","second","third"] },
				{ input:"\n\n\n\n", expected:["","","","",""] },
				{ input:"only", expected:["only"] },
				{ input:"\nsecond", expected:["","second"] },
				{ input:"first\nsecond", expected:["first","second"] },
				{ input:"first\n\nthird", expected:["first","","third"] },
				{ input:"start `left\nright` end", expected:["start `left","right` end"] },
				{ input:"first\n`left\nright`\nthird", expected:["first","`left","right`","third"] },
				{ input:"first\n``left\nright``\nthird", expected:["first","``left","right``","third"] },
				{ input:"first\n```left\nright```\nthird", expected:["first","```left\nright```","third"] },
				{ input:"first\n``left`\nright``\nthird", expected:["first","``left`","right``","third"] },
				{ input:"fir``st\n`left\nright``\nthird", expected:["fir``st","`left","right``","third"] },
				{ input:";\n```jk\nl;kj\n```\nj`\nkj;`\njk`\njk;`\nk;lj`k\n;`;\njkl`\n", expected:[";","```jk\nl;kj\n```","j`","kj;`","jk`","jk;`","k;lj`k",";`;","jkl`",""] },
				{ input:"pc::Well?\n`hoobla::What?`\ngm::...and `there\nthey` waited ...", expected:["pc::Well?","`hoobla::What?`","gm::...and `there","they` waited ..."] },
				{ input:"pc::Well?\n`hoobla::What?`\ngm::...and ```there\nthey``` waited ...", expected:["pc::Well?","`hoobla::What?`","gm::...and ```there\nthey``` waited ..."] },
			];
			tests.forEach(({ input, limit, expected }) => {
				test(tagLiterals`${input}.split(${splitter}, ${limit}) === ${expected}`, () => {
					expect(input.split(splitter, limit)).toStrictEqual(expected);
				});
			});

		});
	});
});
