import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { compressId, decompressId, randomSnowflake, randomUuid } from "../build/index.js";

describe("id", () => {
	const maxUuid  = "ffffffff-ffff-ffff-ffff-ffffffffffff";
	const uuid = "E86B3BB5-43B2-4A13-AF43-62AE79C5B081".toLowerCase();
	const minUuid  = '00000000-0000-0000-0000-000000000000';
	const did = "644942473315090434";
	const minDid = "0".padStart(16, "0");

	const tests = [maxUuid, uuid, minUuid, did, minDid];
	for (let i = 0; i <  100; i++) {
		tests.push(randomSnowflake());
		tests.push(randomUuid());
	}

	tests.forEach(value => {
		test(tagLiterals`decompressId(compressId(${value}))`, () => {
			const compressed = compressId(value);
			const decompressed = decompressId(compressed);
			expect(compressed.length).toBeLessThan(value.length);
			expect(decompressed.length).toBeGreaterThan(compressed.length);
			expect(decompressed).toBe(value);
		});
	});

});