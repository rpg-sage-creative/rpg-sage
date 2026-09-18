import { globalizeRegex, tagLiterals } from "../../build/index.js";

/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape
*/

describe("regex", () => {
	describe("globalizeRegex", () => {

		const tests = [
			/a/,
			/a/i,
			/a/m,
			/a/u,
			/a/v,
			/a/y,

			/a/g,
			/a/ig,
			/a/mg,
			/a/ug,
			/a/vg,
			/a/yg,

			/a/gi,
			/a/gm,
			/a/gu,
			/a/gv,
			/a/gy,
		].map(regexp => {
			const source = regexp.source;
			const flags = (regexp.flags.replace("g", "") + "g").split("").sort().join("");
			return { regexp, source, flags };
		});

		tests.forEach(({ regexp, source, flags }) => {
			test(tagLiterals`globalizeRegex(${regexp}) === ${source}/${flags}`, () => {
				const regexpg = globalizeRegex(regexp);
				expect(regexpg.source).toBe(source);
				expect(regexpg.flags.split("").sort().join("")).toBe(flags);
			});
		});

	});
});
