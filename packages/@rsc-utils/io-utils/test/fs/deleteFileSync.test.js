import { toLiteral } from "@rsc-utils/core-utils";
import { deleteFileSync, writeFileSync } from "../../build/index.js";

describe("fs", () => {
	describe("deleteFileSync", () => {

		const filePath = "made_up_path_sync";

		test(`deleteFileSync(${toLiteral(filePath)}) === true`, () => {
			expect(deleteFileSync(filePath)).toBe(true);
		});

		test(`deleteFileSync(${toLiteral(filePath)}, { force:false }) === true`, () => {
			expect(() => deleteFileSync(filePath, { force:false })).toThrow();
		});

		test(`deleteFileSync(${toLiteral(filePath)}, { checkExists:"before" }) === "NotFound"`, () => {
			expect(deleteFileSync(filePath, { checkExists:"before" })).toBe("NotFound");
		});

		test(`deleteFileSync(${toLiteral(filePath)}, { checkExists:true }) === "NotFound"`, () => {
			expect(deleteFileSync(filePath, { checkExists:true })).toBe("NotFound");
		});

		test(`deleteFileSync(${toLiteral(filePath)}, { checkExists:true }) === "NotFound"`, () => {
			writeFileSync(filePath, filePath);
			expect(deleteFileSync(filePath, { checkExists:true })).toBe(true);
		});

	});
});