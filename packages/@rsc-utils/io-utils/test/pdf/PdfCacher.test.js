import { join, resolve } from "node:path";
import { error, tagLiterals } from "@rsc-utils/core-utils";
import { PdfCacher, PdfJsonFieldManager, PdfJsonManager, writeFileSync } from "../../build/index.js";

beforeAll(() => {
	process.env.dataRoot = "./test";
});

function toTestFilePath(...parts) {
	if (resolve(".").includes("/rpg-sage")) {
		return "file://" + resolve(join("packages/@rsc-utils/io-utils", "test", ...parts));
	}
	return "file://" + resolve(join(".", "test", ...parts));
}

describe("pdf", () => {
	describe("PdfCacher", () => {

		const tests = [
			{ url:"https://pf2.rpgsage.io/pathbuilder-2e-mal-level-4.pdf", values:[{ key:"CharacterName",value:"Malken'throp (Mal)"}] },
			{ url:toTestFilePath("pdf", "in", "BudMastercraft.pdf"), values:[{ key:"text_1wgcm", value:"Character Name" }] },
		];

		tests.forEach(({ url, values }, index) => {
			const testFields = fieldManager => {
				values.forEach(({ key, value }) => {
					expect(fieldManager.getValue(key)).toBe(value);
				});
			};

			describe(url, () => {

				test(tagLiterals`await PdfCacher.read(${url}).catch(error)`, async () => {
					const content = await PdfCacher.read(url).catch(error);
					expect(content).toBeDefined();
					const jsonManager = PdfJsonManager.from(content);
					expect(jsonManager).toBeDefined();
					expect(jsonManager.hasAllSnippets("Hit%20Points")).toBe(true);
					const fieldManager = jsonManager.fields;
					testFields(fieldManager);
					// writeFileSync(`./test/pdf/out/read-${index}.json`, content, { formatted:true, makeDir:true });
				});

				test(tagLiterals`await PdfCacher.readFields(${url}).catch(error)`, async () => {
					const fieldManager = await PdfCacher.readFields(url).catch(error);
					expect(fieldManager).toBeDefined();
					testFields(fieldManager);
					// writeFileSync(`./test/pdf/out/readFields-${index}.json`, fieldManager.fields, { formatted:true, makeDir:true });
				});

			});
		});

	});
});
// runTests(async function test_PdfUtils() {
// 	const urlOne = "https://pf2.rpgsage.io/pathbuilder-2e-mal-level-4.pdf";
// 	const contentOne = await PdfCacher.read(urlOne).catch(error);
// 	assert(!!contentOne, "File (Mal) was NOT cached and read.");
// 	const managerOne = PdfJsonFieldManager.from(contentOne);
// 	const nameOne = managerOne.getValue("CharacterName");
// 	assert(nameOne === "Malken'throp (Mal)", `Wrong CharacterName: ${nameOne}`);
// 	// writeFileSync("./test/pdf/out/mal.json", contentOne);

// 	const urlTwo = toTestFilePath("pdf","in","1264091676897448063.pdf");
// 	const managerTwo = await PdfCacher.createManager(urlTwo).catch(error);
// 	const nameTwo = managerTwo.getString("Character_Name");
// 	const ale_1 = managerTwo.isChecked("Ale_1");
// 	assert(nameTwo === "Todd Campbell", `Wrong Character_Name: ${nameTwo}`);
// 	assert(ale_1, `Not Checked (Ale_1): ${ale_1}`);
// 	// writeFileSync("./test/pdf/out/todd.json", contentTwo);

// 	const urlThree = toTestFilePath("pdf","in","BudMastercraft.pdf");
// 	const contentThree = await PdfCacher.read(urlThree).catch(error);
// 	assert(!!contentThree, "File (Bud) was NOT cached and read.");
// 	const managerThree = new PdfJsonFieldManager(contentThree, f => ({ id:+f.name.replace(/\D/g, ""), ...f }));
// 	const nameThree = managerThree.getValue(1);
// 	assert(nameThree === "Character Name", `Wrong Character_Name: ${nameThree}`);

// 	const urlFour = toTestFilePath("pdf","in","Tjut!.pdf");
// 	const contentFour = await PdfCacher.read(urlFour).catch(error);
// 	assert(!contentFour, `Tjut! can't be read, thus this should be false, negated, and thus ok.`);
// 	// assert(!!contentFour, "File (Tjut!) was NOT cached and read.");
// 	// const managerFour = new PdfJsonFieldManager(contentFour, f => ({ id:+f.name.replace(/\D/g, ""), ...f }));
// 	// const nameFour = managerFour.getValue(1);
// 	// assert(nameFour === "Tjut!", `Wrong Character_Name: ${nameFour}`);
// }, true);

		// test(`/Users/randaltmeyer/git/rsc/io-utils/test/pdf/in/Nitrobytev2.pdf`, async () => {
		// 	const url = "file:/Users/randaltmeyer/git/rsc/io-utils/test/pdf/in/Nitrobytev2.pdf";
		// 	const content = await PdfCacher.read(url).catch(error);
		// 	expect(content).toBeDefined();
		// 	console.debug(content);
		// });