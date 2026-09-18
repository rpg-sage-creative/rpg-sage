import { error, parseJson, tagLiterals, toLiteral } from "@rsc-utils/core-utils";
import { readFile, readFileSync, readJsonDb, readJsonDbSync, readJsonFile, readJsonFileSync, readText, readTextSync } from "../../build/index.js";
import { getTestRoot } from "./getTestRoot.js";

const TEST_ROOT = getTestRoot();

describe("fs", () => {
	describe("readFiles", () => {

		test(`readFile() invalid `, async () => {
			const readFileNotFound = await readFile(`${TEST_ROOT}/files/_jsonFile.json`).catch(error);
			expect(Buffer.isBuffer(readFileNotFound)).toBe(false);
		});

		test(`readFileSync() invalid `, async () => {
			const readFileSyncNotFound = readFileSync(`${TEST_ROOT}/files/_jsonFile.json`);
			expect(Buffer.isBuffer(readFileSyncNotFound)).toBe(false);
		});

		test(`readFile() returns Buffer `, async () => {
			const readFileBuffer = await readFile(`${TEST_ROOT}/files/jsonFile.json`);
			expect(Buffer.isBuffer(readFileBuffer)).toBe(true);
		});

		test(`readFileSync() returns Buffer `, async () => {
			const readFileSyncBuffer = readFileSync(`${TEST_ROOT}/files/jsonFile.json`);
			expect(Buffer.isBuffer(readFileSyncBuffer)).toBe(true);
		});

		const textContent = `{"index":0,"name":"zero"}`;

		test(tagLiterals`readText() === ${textContent}`, async () => {
			const readTextContent = await readText(`${TEST_ROOT}/files/jsonFile.json`);
			expect(readTextContent).toBe(textContent);
		});

		test(tagLiterals`readTextSync() === ${textContent} `, async () => {
			const readTextSyncContent = readTextSync(`${TEST_ROOT}/files/jsonFile.json`);
			expect(readTextSyncContent).toBe(textContent);
		});

		const jsonContent = parseJson(textContent);

		test(tagLiterals`readJsonFile() equals ${jsonContent}`, async () => {
			const readJsonObject = await readJsonFile(`${TEST_ROOT}/files/jsonFile.json`);
			expect(readJsonObject).toStrictEqual(jsonContent);
		});

		test(tagLiterals`readJsonFileSync() equals ${jsonContent} `, async () => {
			const readJsonSyncObject = readJsonFileSync(`${TEST_ROOT}/files/jsonFile.json`);
			expect(readJsonSyncObject).toStrictEqual(jsonContent);
		});

		const jsonArray = [{"index":0,"name":"zero"},{"index":1,"name":"one","bigInt":9223372036854775807n}];

		test(tagLiterals`readJsonDb() equals ${jsonArray}`, async () => {
			const readJsonDbArray = await readJsonDb(`${TEST_ROOT}/files/jsonDb.json.db`);
			expect(readJsonDbArray).toStrictEqual(jsonArray);
		});

		test(tagLiterals`readJsonDbSync() equals ${jsonArray} `, async () => {
			const readJsonDbSyncArray = readJsonDbSync(`${TEST_ROOT}/files/jsonDb.json.db`);
			expect(readJsonDbSyncArray).toStrictEqual(jsonArray);
		});

	});
});
