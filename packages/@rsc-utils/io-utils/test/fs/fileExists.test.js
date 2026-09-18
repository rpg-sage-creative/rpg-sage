import { fileExists } from "../../build/index.js";
import { getTestRoot } from "./getTestRoot.js";

describe("fs", () => {
	describe("fileExists", () => {

		const dir = getTestRoot("files");
		const file = getTestRoot("fileExists.test.js");
		const invalid = getTestRoot("NOT_VALID.js");

		test(`${dir} exists`, async () => {
			expect(await fileExists(dir)).toBe(true);
		});
		test(`${file} exists`, async () => {
			expect(await fileExists(file)).toBe(true);
		});
		test(`${invalid} exists`, async () => {
			expect(await fileExists(invalid)).toBe(false);
		});

	});
});