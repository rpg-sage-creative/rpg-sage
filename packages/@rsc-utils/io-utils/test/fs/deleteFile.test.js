import { toLiteral } from "@rsc-utils/core-utils";
import { deleteFile, writeFileSync } from "../../build/index.js";

describe("fs", () => {
	describe("deleteFile", () => {

		const filePath = "made_up_path_async";

		// default force is true, which bypasses errors deleting a non-existant file
		test(`deleteFile(${toLiteral(filePath)}) === true`, async () => {
			expect(await deleteFile(filePath)).toBe(true);
		});
		// passing in force causes it to throw
		test(`deleteFile(${toLiteral(filePath)}, { force:false }) !== true`, async () => {
			expect(await deleteFile(filePath, { force:false }).catch(()=>{})).not.toBe(true);
		});

		test(`deleteFile(${toLiteral(filePath)}, { checkExists:"before" }) === "NotFound"`, async () => {
			expect(await deleteFile(filePath, { checkExists:"before" })).toBe("NotFound");
		});
		test(`deleteFile(${toLiteral(filePath)}, { checkExists:"before", force:false }) === "NotFound"`, async () => {
			expect(await deleteFile(filePath, { checkExists:"before", force:false })).toBe("NotFound");
		});

		test(`deleteFile(${toLiteral(filePath)}, { checkExists:true }) === "NotFound"`, async () => {
			expect(await deleteFile(filePath, { checkExists:true })).toBe("NotFound");
		});

		test(`deleteFile(${toLiteral(filePath)}, { checkExists:true }) === "NotFound"`, async () => {
			writeFileSync(filePath, filePath);
			expect(await deleteFile(filePath, { checkExists:true })).toBe(true);
		});

	});
});