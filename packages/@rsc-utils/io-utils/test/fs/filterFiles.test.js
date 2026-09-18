import { tagLiterals } from "@rsc-utils/core-utils";
import { filterFiles, filterFilesSync } from "../../build/index.js";
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
	].map(f => getTestRoot(f));

	const recursiveFiles = [
		'files/jsonDb.json.db',
		'files/jsonFile.json',
		'files/jsonFileOne.json',
		'files/jsonFileTwo.json',
		'getTestRoot.js',
	]
	.map(f => getTestRoot(f))
	.concat(testFiles)
	.sort();

	const recursiveJsonFiles = recursiveFiles.filter(s => s.endsWith("json"));

	const tests = [
		{ path, options:{ fileExt:"test.js" }, files:testFiles },
		{ path, options:{ dirFilter:f => f !== "out", fileFilter:f => f, recursive:true }, files:recursiveFiles },
		{ path, options:{ fileExt:"json", recursive:true }, files:recursiveJsonFiles },
	];

	describe("filterFiles", () => {

		tests.forEach(({ path, options, files }) => {
			test(tagLiterals`filterFiles(${path}, ${options})`, async () => {
				expect(await filterFiles(path, options)).toStrictEqual(files);
			});
		});

	});

	describe("filterFilesSync", () => {

		tests.forEach(({ path, options, files }) => {
			test(tagLiterals`filterFilesSync(${path}, ${options})`, () => {
				expect(filterFilesSync(path, options)).toStrictEqual(files);
			});
		});

	});
});
