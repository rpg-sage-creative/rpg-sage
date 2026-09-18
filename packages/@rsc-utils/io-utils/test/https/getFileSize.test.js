import { toLiteral } from "@rsc-utils/core-utils";
import { getFileSize } from "../../build/index.js";

describe("https", () => {
	describe("getFileSize", () => {

		const url = "https://rpgsage.io/images/docs/invite-permission-list.jpg";
		const expectedFileSize = 21413;
		test(`getFileSize(${toLiteral(url)}) === ${toLiteral(expectedFileSize)}`, async () => {
			const fileSize = await getFileSize(url);
			expect(fileSize).toBe(expectedFileSize);
		});

	});
});