import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { generateSnowflake, generateUuid, isValidId } from "../build/index.js";

describe("id", () => {
	const maxUuid  = "ffffffff-ffff-ffff-ffff-ffffffffffff";
	const uuid = "E86B3BB5-43B2-4A13-AF43-62AE79C5B081".toLowerCase();
	const minUuid  = '00000000-0000-0000-0000-000000000000';
	const did = "644942473315090434";
	const minDid = "0".padStart(16, "0");

	const tests = [
		{ id:maxUuid, expected:false },
		{ id:uuid, expected:true },
		{ id:minUuid, expected:false },
		{ id:did, expected:true },
		{ id:minDid, expected:false },
	];
	for (let i = 0; i <  100; i++) {
		tests.push({ id:generateSnowflake(), expected:true });
		tests.push({ id:generateUuid(), expected:true });
	}

	tests.forEach(({ id, expected }) => {
		test(tagLiterals`isValidId(${id}) === ${expected}`, () => {
			expect(isValidId(id)).toBe(expected);
		});
	});

});