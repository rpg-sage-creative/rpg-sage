import { tagLiterals, toCircledNumber } from "../../build/index.js";

describe("characters", () => {
	describe("toCircledNumber", () => {

		const expected = [
			[ -1, '', '', '', '', '' ],
			[ 0, '⓪', '⓿', '', '🄋', '🄌' ],
			[ 1, '①', '❶', '⓵', '➀', '➊' ],
			[ 2, '②', '❷', '⓶', '➁', '➋' ],
			[ 3, '③', '❸', '⓷', '➂', '➌' ],
			[ 4, '④', '❹', '⓸', '➃', '➍' ],
			[ 5, '⑤', '❺', '⓹', '➄', '➎' ],
			[ 6, '⑥', '❻', '⓺', '➅', '➏' ],
			[ 7, '⑦', '❼', '⓻', '➆', '➐' ],
			[ 8, '⑧', '❽', '⓼', '➇', '➑' ],
			[ 9, '⑨', '❾', '⓽', '➈', '➒' ],
			[ 10, '⑩', '❿', '⓾', '➉', '➓' ],
			[ 11, '⑪', '⓫', '', '', '' ],
			[ 12, '⑫', '⓬', '', '', '' ],
			[ 13, '⑬', '⓭', '', '', '' ],
			[ 14, '⑭', '⓮', '', '', '' ],
			[ 15, '⑮', '⓯', '', '', '' ],
			[ 16, '⑯', '⓰', '', '', '' ],
			[ 17, '⑰', '⓱', '', '', '' ],
			[ 18, '⑱', '⓲', '', '', '' ],
			[ 19, '⑲', '⓳', '', '', '' ],
			[ 20, '⑳', '⓴', '', '', '' ],
			[ 21, '㉑', '', '', '', '' ],
			[ 22, '㉒', '', '', '', '' ],
			[ 23, '㉓', '', '', '', '' ],
			[ 24, '㉔', '', '', '', '' ],
			[ 25, '㉕', '', '', '', '' ],
			[ 26, '㉖', '', '', '', '' ],
			[ 27, '㉗', '', '', '', '' ],
			[ 28, '㉘', '', '', '', '' ],
			[ 29, '㉙', '', '', '', '' ],
			[ 30, '㉚', '', '', '', '' ],
			[ 31, '㉛', '', '', '', '' ],
			[ 32, '㉜', '', '', '', '' ],
			[ 33, '㉝', '', '', '', '' ],
			[ 34, '㉞', '', '', '', '' ],
			[ 35, '㉟', '', '', '', '' ],
			[ 36, '㊱', '', '', '', '' ],
			[ 37, '㊲', '', '', '', '' ],
			[ 38, '㊳', '', '', '', '' ],
			[ 39, '㊴', '', '', '', '' ],
			[ 40, '㊵', '', '', '', '' ],
			[ 41, '㊶', '', '', '', '' ],
			[ 42, '㊷', '', '', '', '' ],
			[ 43, '㊸', '', '', '', '' ],
			[ 44, '㊹', '', '', '', '' ],
			[ 45, '㊺', '', '', '', '' ],
			[ 46, '㊻', '', '', '', '' ],
			[ 47, '㊼', '', '', '', '' ],
			[ 48, '㊽', '', '', '', '' ],
			[ 49, '㊾', '', '', '', '' ],
			[ 50, '㊿', '', '', '', '' ]
];

		for (const [number, circle, negCircle, dblCircle, dingbat, negDingbat] of expected) {
			test(tagLiterals`toCircledNumber(${number}) === ${circle}`, () => {
				expect(toCircledNumber(number)).toBe(circle);
			});
			test(tagLiterals`toCircledNumber(${number}, { negative:true }) === ${circle}`, () => {
				expect(toCircledNumber(number, { negative:true })).toBe(negCircle);
			});
			test(tagLiterals`toCircledNumber(${number}, { double:true }) === ${dblCircle}`, () => {
				expect(toCircledNumber(number, { double:true })).toBe(dblCircle);
			});
			test(tagLiterals`toCircledNumber(${number}, { dingbat:true }) === ${dingbat}`, () => {
				expect(toCircledNumber(number, { dingbat:true })).toBe(dingbat);
			});
			test(tagLiterals`toCircledNumber(${number}, { dingbat:true, negative:true }) === ${negDingbat}`, () => {
				expect(toCircledNumber(number, { dingbat:true, negative:true })).toBe(negDingbat);
			});
		}

		const errors = [
			"",
			" ",
			"\t",
			"\n",
			"one",
			NaN,
			true,
			false,
			null,
			undefined,
		];

		for (const value of errors) {
			test(tagLiterals`toCircledNumber(${value}) to throw`, () => {
				expect(() => toCircledNumber(value)).toThrow();
			});
		}
	});
});
