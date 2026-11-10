import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { listFiles, listFilesSync } from "../build/index.js";
import { getTestRoot } from "./getTestRoot.js";

describe("fs", () => {

	const path = getTestRoot();

	const testFiles = [
		'deleteFile.test.ts',
		'deleteFileSync.test.ts',
		'fileExists.test.ts',
		'filterFiles.test.ts',
		'findJsonFile.test.ts',
		'isDir.test.ts',
		'listFiles.test.ts',
		'readFiles.test.ts',
		'readJsonFiles.test.ts',
		'symLink.test.ts',
		'symLinkSync.test.ts',
		'writeFiles.test.ts',
	];

	const files = [
		'files',
		'getTestRoot.js',
	]
	.concat(testFiles)
	.sort();

	describe("listFiles", () => {

		test(tagLiterals`listFiles(${path})`, async () => {
			expect(await listFiles(path)).toStrictEqual(files);
		});
		test(tagLiterals`listFiles(${path}, "test.ts")`, async () => {
			expect(await listFiles(path, "test.ts")).toStrictEqual(testFiles);
		});

	});

	describe("listFilesSync", () => {

		test(tagLiterals`listFilesSync(${path})`, () => {
			expect(listFilesSync(path)).toStrictEqual(files);
		});
		test(tagLiterals`listFilesSync(${path}, "test.ts")`, () => {
			expect(listFilesSync(path, "test.ts")).toStrictEqual(testFiles);
		});

	});

});
