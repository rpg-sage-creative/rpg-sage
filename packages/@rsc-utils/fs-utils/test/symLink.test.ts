import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { deleteFile, fileExists, readJsonFile, symLink } from "../build/index.js";
import { getTestRoot } from "./getTestRoot.js";


describe("fs", () => {
	describe("symLink", () => {

		const dir = getTestRoot("files");
		const file = `${dir}/jsonFile.json`;
		// the link lives in files/out (excluded from listings) and has no .json extension, so concurrent scans never match it mid-create/delete
		const link = `${dir}/out/jsonFile.link`;

		test(tagLiterals`link ${file} as ${link}`, async() => {
			expect(await fileExists(file)).toBe(true);
			expect(await fileExists(link)).toBe(false);
			expect(await symLink(file, link, { makeDir:true, overwrite:true })).toBe(true);
			expect(await fileExists(link)).toBe(true);
			expect(await readJsonFile(file)).toStrictEqual(await readJsonFile(link));
			expect(await deleteFile(link)).toBeTruthy();
		});

	});
});