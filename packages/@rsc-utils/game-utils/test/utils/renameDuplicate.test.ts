import { beforeAll, describe, expect, test } from "vitest";
import { renameDuplicate } from "../../build/utils/renameDuplicate.js";
import { tagLiterals } from "@rsc-utils/core-utils";

beforeAll(() => {
});

describe("utils", () => {
	describe("renameDuplicate", () => {
		const tests = [
			{ name:"", others:[], expected:undefined },
			{ name:"", others:[], type:"number" as "number", expected:undefined },
			{ name:"", others:[], type:"alpha" as "alpha", expected:undefined },
			{ name:"", others:[], type:[] as string[], expected:undefined },
			{ name:"", others:[], type:undefined, expected:undefined },
			{ name:"Bob", others:[], type:undefined, expected:undefined },
			{ name:"Bob", others:["bob"], type:undefined, expected:{ name:"Bob #1", suffix:"#1" } },
			// @TODO ADD MORE TESTS
		];
		tests.forEach(({ name, others, type, expected }) => {
			test(tagLiterals`renameDuplicate(${name}, ${others}, ${type}) === ${expected}`, () => {
				const results = renameDuplicate(name, others, type);
				if (results) {
					const { replacer, ...resultsWithoutReplacer } = results;
					expect(resultsWithoutReplacer).toEqual(expected);
				}else {
					expect(results).toEqual(expected);
				}
			});
		});
	});
});
