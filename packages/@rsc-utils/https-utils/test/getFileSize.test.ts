import { toLiteral } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { getFileSize } from "../build/index.js";

describe("https", () => {
	describe("getFileSize", () => {

		const url = "https://code.rpgsage.app/test/img/259x591-21413.jpg";
		const expectedFileSize = 21413;
		test(`getFileSize(${toLiteral(url)}) === ${toLiteral(expectedFileSize)}`, async () => {
			const fileSize = await getFileSize(url);
			expect(fileSize).toBe(expectedFileSize);
		});

	});
});