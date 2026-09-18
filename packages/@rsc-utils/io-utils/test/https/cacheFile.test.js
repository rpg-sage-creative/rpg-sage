import { enableLogLevels, tagLiterals } from "@rsc-utils/core-utils";
import { existsSync, rmSync, statSync } from "fs";
import { cacheFile } from "../../build/index.js";

enableLogLevels("development");

const filePath = "./invite-permission-list.jpg";

function deleteCacheFile() {
	try { if (existsSync(filePath)) rmSync(filePath); }catch(ex) { }
}

beforeAll(() => deleteCacheFile());

afterAll(() => deleteCacheFile());

describe("https", () => {
	describe("cacheFile", () => {

		const url = "https://rpgsage.io/images/docs/invite-permission-list.jpg";
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