import { redactCodeBlocks, tagLiterals } from "../../../build/index.js";

describe("string", () => {
	describe("codeBlocks", () => {

		const tests = [
			//   input                          expected output
			[" hi `redacted` no `shit` ",   " hi `********` no `****` "],
			[" \\`notredacted\\` `hi` go ", " \\`notredacted\\` `**` go "],
			["`0` ``redacted`` \\`9`",      "`*` ``********`` \\`9`"],
			[" \\``redacted`\\` ",          " \\``********`\\` "],
			[" `\\`redacted\\`` ",          " `************` "],
			[" ```redacted``` ",            " ```********``` "],
			[" ```redacted\nredacted``` ",  " ```*****************``` "],
			[" \\```redacted``\\` ",        " \\```********``\\` "],
			[" `\\``notredacted`\\`` ",     " `**`notredacted`**` "],
			[" \\``\\`redacted``\\` ",      " \\``**********``\\` "],
			[" \\``\\`redacted``\\` ",      " \\``**********``\\` "],
		];
		tests.forEach(([input, expected]) => {
			test(tagLiterals`redactCodeBlocks(${input}) === ${expected}`, () => {
				expect(redactCodeBlocks(input)).toBe(expected);
			});
		});

	});
});
