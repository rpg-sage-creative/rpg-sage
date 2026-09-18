import { removeAccents, tagLiterals } from "../../../build/index.js";

describe("string", () => {
	describe("normalize", () => {
		describe("removeAccents", () => {

			const tests = [
				{ input:"a", expected:"a" },
				{ input:"à", expected:"a" }, // 1
				{ input:"á", expected:"a" }, // 2
				{ input:"â", expected:"a" }, // 3
				{ input:"ä", expected:"a" }, // 4
				{ input:"ǎ", expected:"a" }, // 5
				// { input:"æ", expected:"a" }, // 6
				{ input:"ã", expected:"a" }, // 7
				{ input:"å", expected:"a" }, // 8
				{ input:"ā", expected:"a" }, // 9

				{ input:"b", expected:"b" }, //

				{ input:"c", expected:"c" }, //
				{ input:"ç", expected:"c" }, // 1
				{ input:"ć", expected:"c" }, // 2
				{ input:"č", expected:"c" }, // 3
				{ input:"ċ", expected:"c" }, // 4

				{ input:"d", expected:"d" }, //
				{ input:"ď", expected:"d" }, // 1
				// { input:"ð", expected:"d" }, // 2

				{ input:"e", expected:"e" }, //
				{ input:"è", expected:"e" }, // 1
				{ input:"é", expected:"e" }, // 2
				{ input:"ê", expected:"e" }, // 3
				{ input:"ë", expected:"e" }, // 4
				{ input:"ě", expected:"e" }, // 5
				{ input:"ẽ", expected:"e" }, // 6
				{ input:"ē", expected:"e" }, // 7
				{ input:"ė", expected:"e" }, // 8
				{ input:"ę", expected:"e" }, // 9

				{ input:"f", expected:"f" },  //
				{ input:"ﬀ", expected:"ff" }, // \uFB00


				{ input:"g", expected:"g" }, //
				{ input:"ğ", expected:"g" }, // 1
				{ input:"ġ", expected:"g" }, // 2

				{ input:"h", expected:"h" }, //
				// { input:"ħ", expected:"h" }, //

				{ input:"i", expected:"i" }, //
				{ input:"ì", expected:"i" }, // 1
				{ input:"í", expected:"i" }, // 2
				{ input:"î", expected:"i" }, // 3
				{ input:"ï", expected:"i" }, // 4
				{ input:"ǐ", expected:"i" }, // 5
				{ input:"ĩ", expected:"i" }, // 6
				{ input:"ī", expected:"i" }, // 7
				// { input:"ı", expected:"i" }, // 8
				{ input:"į", expected:"i" }, // 9

				{ input:"j", expected:"j" }, //

				{ input:"k", expected:"k" }, //
				{ input:"ķ", expected:"k" }, // 1

				{ input:"l", expected:"l" }, //
				// { input:"ł", expected:"l" }, // 1
				{ input:"ļ", expected:"l" }, // 2
				{ input:"ľ", expected:"l" }, // 3

				{ input:"m", expected:"m" }, //

				{ input:"n", expected:"n" }, //
				{ input:"ñ", expected:"n" }, // 1
				{ input:"ń", expected:"n" }, // 2
				{ input:"ņ", expected:"n" }, // 3
				{ input:"ň", expected:"n" }, // 4

				{ input:"o", expected:"o" }, //
				{ input:"ò", expected:"o" }, // 1
				{ input:"ó", expected:"o" }, // 2
				{ input:"ô", expected:"o" }, // 3
				{ input:"ö", expected:"o" }, // 4
				{ input:"ǒ", expected:"o" }, // 5
				// { input:"œ", expected:"o" }, // 6
				// { input:"ø", expected:"o" }, // 7
				{ input:"õ", expected:"o" }, // 8
				{ input:"ō", expected:"o" }, // 9

				{ input:"p", expected:"p" }, //

				{ input:"q", expected:"q" }, //

				{ input:"r", expected:"r" }, //
				{ input:"ř", expected:"r" }, // 1

				{ input:"s", expected:"s" }, //
				// { input:"ß", expected:"s" }, // 1
				{ input:"ş", expected:"s" }, // 2
				{ input:"ș", expected:"s" }, // 3
				{ input:"ś", expected:"s" }, // 4
				{ input:"š", expected:"s" }, // 5

				{ input:"t", expected:"t" }, //
				{ input:"ț", expected:"t" }, // 1
				{ input:"ť", expected:"t" }, // 2
				// { input:"þ", expected:"t" }, // 3

				{ input:"u", expected:"u" }, //
				{ input:"ù", expected:"u" }, // 1
				{ input:"ú", expected:"u" }, // 2
				{ input:"û", expected:"u" }, // 3
				{ input:"ü", expected:"u" }, // 4
				{ input:"ǔ", expected:"u" }, // 5
				{ input:"ũ", expected:"u" }, // 6
				{ input:"ū", expected:"u" }, // 7
				{ input:"ű", expected:"u" }, // 8
				{ input:"ů", expected:"u" }, // 9

				{ input:"v", expected:"v" }, //

				{ input:"w", expected:"w" }, //
				{ input:"ŵ", expected:"w" }, // 1

				{ input:"x", expected:"x" }, //

				{ input:"y", expected:"y" }, //
				{ input:"ý", expected:"y" }, // 1
				{ input:"ŷ", expected:"y" }, // 2
				{ input:"ÿ", expected:"y" }, // 3

				{ input:"z", expected:"z" }, //
				{ input:"ź", expected:"z" }, // 1
				{ input:"ž", expected:"z" }, // 2
				{ input:"ż", expected:"z" }, // 3
			];

			tests.forEach(({ input, expected }) => {
				test(tagLiterals`removeAccents(${input}) === ${expected}`, () => {
					expect(removeAccents(input)).toBe(expected);
				});
			});

		});
	});
});
