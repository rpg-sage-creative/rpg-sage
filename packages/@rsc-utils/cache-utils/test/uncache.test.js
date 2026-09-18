import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { uncache } from "../build/index.js";

describe("uncache", () => {

	const tests = [
		[{ a:"A", b:"B", c:new Set(["A","B"]) }, undefined, { a:"A", b:"B", c:new Set() }],
		[{ a:"A", b:"B", c:new Set(["A","B"]) }, { nullify:true }, { a:null, b:null, c:null }],
		[{ a:"A", b:"B", c:new Set(["A","B"]) }, { undefine:true }, { }],
	];

	tests.forEach(([input, args, output]) => {
		test(tagLiterals`uncache(${input}, ${args}) equals ${output}`, () => {
			const ret = uncache(input, args);
			expect(ret).toBe(args?.undefine ? undefined : null);
			expect(input).toEqual(output);
		});
	});

});
