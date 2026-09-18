import { toLiteral } from "@rsc-utils/core-utils";
import { findJsonFile } from "../../build/index.js";
import { getTestRoot } from "./getTestRoot.js";

describe("fs", () => {
	describe("findJsonFile", () => {

		const path = getTestRoot("files");

		const tests = [
			{ path, options:{ contentFilter:json => json.name === "one" }, expected:{"index":0,"name":"one"} },
			{ path, options:{ contentFilter:json => json.name === "two" }, expected:{"index":0,"name":"two"} },
		];

		tests.forEach(({ path, options, expected }) => {
			test(`findJsonFile(${toLiteral(path)}, ${toLiteral(options)}) equals ${toLiteral(expected)}`, async () => {
				const json = await findJsonFile(path, options);
				expect(json).toStrictEqual(expected);
			});
		});

	});
});
