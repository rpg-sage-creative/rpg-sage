import { toLiteral } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { globalizeRegExp } from "../build/index.js";

/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape
*/

describe("globalizeRegExp", () => {

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
		test(`globalizeRegExp(${toLiteral(regexp)}) === ${source}/${flags}`, () => {
			const regexpg = globalizeRegExp(regexp);
			expect(regexpg.source).toBe(source);
			expect(regexpg.flags.split("").sort().join("")).toBe(flags);
		});
	});

});
