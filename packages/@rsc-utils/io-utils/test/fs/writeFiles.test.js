import { tagLiterals, toLiteral } from "@rsc-utils/core-utils";
import { appendJsonDb, deleteFileSync, readTextSync, writeFile, writeFileSync, writeJsonDb, writeJsonDbSync } from "../../build/index.js";
import { getTestRoot } from "./getTestRoot.js";

const TEST_ROOT = getTestRoot();

describe("fs", () => {
	describe("writeFiles", () => {

		const filePath = `${TEST_ROOT}/files/out/file.txt`;
		const jsonDbFilePath = `${TEST_ROOT}/files/out/file.json.db`;

		const tests = [
			{ json:{"index":0,"name":"zero"}, text:`{"index":0,"name":"zero"}` },
			{ json:{"index":1,"name":"one"}, text:`{"index":1,"name":"one"}` },
			{ json:{"index":2,"name":"two","bigInt":9223372036854775807n}, text:`{"index":2,"name":"two","bigInt":{"$bigint":"9223372036854775807"}}` },
		];

		test(tagLiterals`writeJsonDb(${filePath})`, async () => {
			const created = await writeJsonDb(filePath, tests.map(t => t.json), true);
			expect(created).toBe(true);
			expect(readTextSync(filePath)).toBe(tests.map(t => t.text).join("\n"));
			const deleted = deleteFileSync(filePath);
			expect(deleted).toBe(true);
		});

		test(tagLiterals`writeJsonDbSync(${filePath})`, () => {
			const created = writeJsonDbSync(filePath, tests.map(t => t.json), true);
			expect(created).toBe(true);
			expect(readTextSync(filePath)).toBe(tests.map(t => t.text).join("\n"));
			const deleted = deleteFileSync(filePath);
			expect(deleted).toBe(true);
		});

		tests.forEach(({ json, text }, index) => {
			// writeFileSync json
			test(tagLiterals`writeFileSync(${filePath}, ${json})`, () => {
				const created = writeFileSync(filePath, json, true);
				expect(created).toBe(true);
				expect(readTextSync(filePath)).toBe(text);
				const deleted = deleteFileSync(filePath);
				expect(deleted).toBe(true);
			});
			// writeFileSync text
			test(tagLiterals`writeFileSync(${filePath}, ${text})`, () => {
				const created = writeFileSync(filePath, text, true);
				expect(created).toBe(true);
				expect(readTextSync(filePath)).toBe(text);
				const deleted = deleteFileSync(filePath);
				expect(deleted).toBe(true);
			});
			// writeFile json
			test(tagLiterals`writeFile(${filePath}, ${json})`, async () => {
				const success = await writeFile(filePath, json, true);
				expect(success).toBe(true);
				expect(readTextSync(filePath)).toBe(text);
				const deleted = deleteFileSync(filePath);
				expect(deleted).toBe(true);
			});
			// writeFileSync text
			test(tagLiterals`writeFile(${filePath}, ${text})`, async () => {
				const success = await writeFile(filePath, text, true);
				expect(success).toBe(true);
				expect(readTextSync(filePath)).toBe(text);
				const deleted = deleteFileSync(filePath);
				expect(deleted).toBe(true);
			});
			// appendJsonDb json
			test(tagLiterals`appendJsonDb`, async () => {
				const appended = await appendJsonDb(jsonDbFilePath, json, true);
				expect(appended).toBe(true);
				const text = tests.slice(0, index + 1).map(t => t.text).join("\n"); // NOSONAR
				expect(readTextSync(jsonDbFilePath)).toBe(text);
			});
		});
		test(`delete file.json.db`, () => expect(deleteFileSync(jsonDbFilePath)).toBe(true));

	});
});
