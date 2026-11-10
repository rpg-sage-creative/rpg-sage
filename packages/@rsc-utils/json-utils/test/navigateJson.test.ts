import { describe, expect, test } from "vitest";
import { navigateJson, stringifyJson } from "../build/index.js";

type NavigateData = [
	object: unknown,
	path: string,
	expected: {
		depth: number;
		path: string;
		isFull: boolean;
		parent: unknown;
		key: string;
		value?: unknown;
	}
];

describe("json", () => {
	describe("navigateJson", () => {

		// [object, path, expected results]
		const tests: NavigateData[] = [
			// full navigation
			[{ a:1 }, "a", { depth:1, path:"a", isFull:true, parent:{ a:1 }, key:"a", value:1 }],
			[{ a:{ b:1 } }, "a.b", { depth:2, path:"a.b", isFull:true, parent:{ b:1 }, key:"b", value:1 }],
			[{ list:[{ n:1 }] }, "list.0.n", { depth:3, path:"list.0.n", isFull:true, parent:{ n:1 }, key:"n", value:1 }],

			// full navigation to an object value
			[{ a:{ b:{ c:2 } } }, "a.b", { depth:2, path:"a.b", isFull:true, parent:{ b:{ c:2 } }, key:"b", value:{ c:2 } }],

			// full navigation when the value is undefined (the key exists)
			[{ a:undefined }, "a", { depth:1, path:"a", isFull:true, parent:{ a:undefined }, key:"a", value:undefined }],

			// missing keys stop at the last object navigated
			[{ a:1 }, "x", { depth:0, path:"", isFull:false, parent:{ a:1 }, key:"x" }],
			[{ a:{ b:1 } }, "a.x.y", { depth:1, path:"a", isFull:false, parent:{ b:1 }, key:"x" }],

			// navigation stops when the next value is not an object
			[{ a:{ b:1 } }, "a.b.c", { depth:2, path:"a.b", isFull:false, parent:1, key:"c" }],

			// null/undefined objects cannot be navigated
			[null, "a", { depth:0, path:"", isFull:false, parent:null, key:"a" }],
		];

		tests.forEach(([object, path, expected]) => {
			test(`navigateJson(${stringifyJson(object)}, "${path}")`, () => {
				expect(navigateJson(object, path)).toEqual(expected);
			});
		});
	});
});
