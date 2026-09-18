import { tagLiterals } from "@rsc-utils/core-utils";
import { isDir, isDirSync } from "../../build/index.js";
import { getTestRoot } from "./getTestRoot.js";

describe("fs", () => {

	const dir = getTestRoot("files");
	const file = getTestRoot("isDir.test.js");
	const invalid = getTestRoot("NOT_VALID.js");

	describe("isDir", () => {

		test(tagLiterals`isDir(${dir}) === true`, async () => {
			expect(await isDir(dir)).toBe(true);
		});

		test(tagLiterals`isDir(${file}) === false`, async () => {
			expect(await isDir(file)).toBe(false);
		});

		test(tagLiterals`isDir(${invalid}) should throw`, async () => {
			let err;
			await isDir(invalid).catch(_err => err = _err);
			expect(err).toBeDefined();
		});

	});

	describe("isDirSync", () => {

		test(tagLiterals`isDirSync(${dir}) === true`, () => {
			expect(isDirSync(dir)).toBe(true);
		});

		test(tagLiterals`isDirSync(${file}) === false`, () => {
			expect(isDirSync(file)).toBe(false);
		});

		test(tagLiterals`isDirSync(${invalid}) === false`, () => {
			expect(isDirSync(invalid)).toBe(false);
		});

	});
});