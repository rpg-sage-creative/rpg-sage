import { tagLiterals } from "@rsc-tools/dev-scripts";
import { existsSync, rmSync, statSync } from "fs";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { cacheFile } from "../build/index.js";


const filePath = "./259x591-21413.jpg";

function deleteCacheFile() {
	try { if (existsSync(filePath)) rmSync(filePath); }catch(ex) { }
}

beforeAll(() => deleteCacheFile());

afterAll(() => deleteCacheFile());

describe("https", () => {
	describe("cacheFile", () => {

		const url = "https://code.rpgsage.app/test/img/259x591-21413.jpg";
		const expectedFileSize = 21413;

		const options = { url, filePath, logPercent:true };

		test(tagLiterals`cacheFile(${options})`, async () => {
			const cached = await cacheFile(options);
			expect(cached).toBe(true);

			const fileSize = statSync(filePath).size;
			expect(fileSize).toBe(expectedFileSize);
		});

		test.todo("figure out how to log validate logging progress");

	});
});