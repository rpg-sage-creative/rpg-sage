import { describe, expect, test } from "vitest";
import { uncache } from "../build/index.js";
import { tagLiterals as _ } from "@rsc-tools/dev-scripts";

describe("uncache", () => {

	const tests = [
		[{ a:"A", b:"B", c:new Set(["A","B"]) }, undefined, { a:"A", b:"B", c:new Set() }],
		[{ a:"A", b:"B", c:new Set(["A","B"]) }, { nullify:true }, { a:null, b:null, c:null }],
		[{ a:"A", b:"B", c:new Set(["A","B"]) }, { undefine:true }, { }],
	];

	tests.forEach(([input, args, output]) => {
		test(_`uncache(${input}, ${args}) equals ${output}`, () => {
			const ret = uncache(input, args);
			expect(ret).toBe(args?.undefine ? undefined : null);
			expect(input).toEqual(output);
		});
	});

});
