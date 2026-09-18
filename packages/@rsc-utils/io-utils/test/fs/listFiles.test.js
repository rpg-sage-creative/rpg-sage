import { tagLiterals } from "@rsc-utils/core-utils";
import { listFiles, listFilesSync } from "../../build/index.js";
import { getTestRoot } from "./getTestRoot.js";

describe("fs", () => {

	const path = getTestRoot();

	const testFiles = [
		'deleteFile.test.js',
		'deleteFileSync.test.js',
		'fileExists.test.js',
		'filterFiles.test.js',
		'findJsonFile.test.js',
		'isDir.test.js',
		'listFiles.test.js',
		'readFiles.test.js',
		'readJsonFiles.test.js',
		'symLink.test.js',
		'symLinkSync.test.js',
		'writeFiles.test.js',
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
		test(tagLiterals`listFiles(${path}, "test.js")`, async () => {
			expect(await listFiles(path, "test.js")).toStrictEqual(testFiles);
		});

	});

	describe("listFilesSync", () => {

		test(tagLiterals`listFilesSync(${path})`, () => {
			expect(listFilesSync(path)).toStrictEqual(files);
		});
		test(tagLiterals`listFilesSync(${path}, "test.js")`, () => {
			expect(listFilesSync(path, "test.js")).toStrictEqual(testFiles);
		});

	});

});
