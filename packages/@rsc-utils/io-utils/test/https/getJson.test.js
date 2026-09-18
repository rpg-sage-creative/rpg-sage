import { enableLogLevels, tagLiterals } from "@rsc-utils/core-utils";
import { getJson } from "../../build/index.js";

enableLogLevels("development");

describe("https", () => {
	describe("getJson", () => {

		const url = "https://pf2.rpgsage.io/abc/some.json";

		test(tagLiterals`getJson(${url})`, async () => {
			const json = await getJson(url, undefined, { logPercent:true });
			expect(Array.isArray(json)).toBe(true);
		});

		const urlSF1e = "https://hephaistos.online/query";
		const dataSF1e = {"query":`{\n\tcharacters(readOnlyPermalinkId: "213430835") {\n\t\tjson\n\t}\n}`};
		test(tagLiterals`getJson(${urlSF1e}, ${dataSF1e})`, async () => {
			const graphQlJson = await getJson(urlSF1e, dataSF1e, { logPercent:true });
			expect(graphQlJson).toBeDefined();
			// const { data:{ characters:{ 0:{ json:raw } } } } = graphQlJson;
			// console.log({raw});
			// const json = JSON.parse(raw);
			// console.log({json});
		});

		// const urlSF2e = "https://sf2e.hephaistos.online/query";
		// const dataSF2e = {"query":`{\n\tcharacters(readOnlyPermalinkId: "01K95X1TWSA8WY5RFW5YQK1350") {\n\t\tjson\n\t}\n}`};
		// test(tagLiterals`getJson(${urlSF2e}, ${dataSF2e})`, async () => {
		// 	const graphQlJson = await getJson(urlSF2e, dataSF2e);
		// 	expect(graphQlJson).toBeDefined();
		// 	const { data:{ characters:{ 0:{ json:raw } } } } = graphQlJson;
		// 	// console.log({raw});
		// 	const json = JSON.parse(raw);
		// 	// console.log({json});
		// });
	});
});