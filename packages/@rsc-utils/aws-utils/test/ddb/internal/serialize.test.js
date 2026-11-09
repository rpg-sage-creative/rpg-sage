import { tagLiterals } from "@rsc-tools/dev-scripts";
import { serialize } from "../../../build/ddb/internal/serialize.js";
import { getTests } from "../data.js";

describe("ddb", () => {
	describe("serialize", () => {

		const tests = getTests("serialize");

		tests.forEach(({ serialized, deserialized }) => {
			test(tagLiterals`serialize(${deserialized}) === ${serialized}`, () => {
				expect(serialize(deserialized)).toStrictEqual(serialized);
			});
		});

	});
});