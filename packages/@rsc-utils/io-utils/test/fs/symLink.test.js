import { enableLogLevels, tagLiterals } from "@rsc-utils/core-utils";
import { deleteFile, fileExists, readJsonFile, symLink } from "../../build/index.js";
import { getTestRoot } from "./getTestRoot.js";

enableLogLevels("development");

describe("fs", () => {
	describe("symLink", () => {

		const dir = getTestRoot("files");
		const file = `${dir}/jsonFile.json`;
		const original = `./jsonFile.json`
		const link = `${dir}/jsonFile.link.json`;

		test(tagLiterals`link ${file} as ${link}`, async() => {
			expect(await fileExists(file)).toBe(true);
			expect(await fileExists(link)).toBe(false);
			expect(await symLink(original, link, { overwrite:true })).toBe(true);
			expect(await fileExists(link)).toBe(true);
			expect(await readJsonFile(file)).toStrictEqual(await readJsonFile(link));
			expect(await deleteFile(link)).toBeTruthy();
		});

	});
});