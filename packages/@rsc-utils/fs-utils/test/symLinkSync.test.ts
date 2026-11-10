import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { deleteFileSync, fileExistsSync, readJsonFileSync, symLinkSync } from "../build/index.js";
import { getTestRoot } from "./getTestRoot.js";


describe("fs", () => {
	describe("symLinkSync", () => {

		const dir = getTestRoot("files");
		const file = `${dir}/jsonFile.json`;
		// the link lives in files/out (excluded from listings) and has no .json extension, so concurrent scans never match it mid-create/delete
		const link = `${dir}/out/jsonFile.link-sync`;

		test(tagLiterals`link ${file} as ${link}`, () => {
			expect(fileExistsSync(file)).toBe(true);
			expect(fileExistsSync(link)).toBe(false);
			expect(symLinkSync(file, link, { makeDir:true, overwrite:true })).toBe(true);
			expect(fileExistsSync(link)).toBe(true);
			expect(readJsonFileSync(file)).toStrictEqual(readJsonFileSync(link));
			expect(deleteFileSync(link)).toBeTruthy();
		});

	});
});