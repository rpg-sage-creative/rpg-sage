import { readJsonFiles } from "../../build/index.js";
import { getTestRoot } from "./getTestRoot.js";

describe("fs", () => {
	describe("readJsonFiles", () => {

		const one = {"index":0,"name":"one"};
		const two = {"index":0,"name":"two"};

		const path = getTestRoot("files");

		test(`readJsonFiles() filtered to "one"`, async () => {
			const contentFilter = json => json.name === "one";
			const json = await readJsonFiles(path, { contentFilter });
			expect(json).toStrictEqual([one]);
		});

		test(`readJsonFiles() filtered to "two"`, async () => {
			const contentFilter = json => json.name === "two";
			const json = await readJsonFiles(path, { contentFilter });
			expect(json).toStrictEqual([two]);
		});

		test(`readJsonFiles() filtered to "one" and "two"`, async () => {
			const contentFilter = json => ["one","two"].includes(json.name);
			const json = await readJsonFiles(path, { contentFilter });
			expect(json).toStrictEqual([one, two]);
		});

	});
});
