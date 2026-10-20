import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { chunk } from "../build/index.js";

describe("chunk", () => {

	// [expectedArray, inputString, maxChunkLength]
	const input: [string[], string|undefined, number][] = [
		[["this is\n a sentence\n that has a\n bunch of words."], "this is\n a sentence\n that has a\n bunch of words.", 2000],
		[["this is", " a sentence", " that has a", " bunch of", " words."], "this is\n a sentence\n that has a\n bunch of words.", 15],
		[["this is a", " sentence that", " has a bunch", " of words."], "this is a sentence that has a bunch of words.", 15],
		[[], " \t \n ".trim(), 2000],
		[[], undefined, 2000],
	];
	input.forEach(([expected, value, maxChunkLength]) => {
		const options = { maxChunkLength };
		test(tagLiterals`chunk(${value}, ${options})`, () => {
			expect(chunk(value, options)).toEqual(expected);
		});
	});

});
