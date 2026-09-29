import { tagLiterals, toLiteral } from "@rsc-utils/core-utils";
import { deserialize } from "../../../build/ddb/internal/deserialize.js";
import { getTests } from "../data.js";

describe("ddb", () => {
	describe("deserialize", () => {

		const tests = getTests("deserialize");

		tests.forEach(({ serialized, deserialized }) => {
			test(tagLiterals`deserialize(${serialized}) === ${deserialized}`, () => {
				expect(deserialize(serialized)).toStrictEqual(deserialized);
			});
		});

	});
});