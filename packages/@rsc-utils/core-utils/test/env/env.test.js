import { getBuildInfo, getCodeName, getDataRoot, getEnvironmentName, getId, getIds, tagLiterals } from "../../build/index.js";

const hasArgs = process.argv.slice(3).length > 0;

describe("env", () => {

	if (hasArgs) {

		test.todo("add env tests that have args");

	}else {

		test(`getCodeName()`, () => {
			expect(getCodeName).toThrow("Environment Variable Missing: codeName,NODE_ENV");
		});

		test(`getDataRoot()`, () => {
			expect(getDataRoot).toThrow("Environment Variable Missing: dataRoot");
		});

		test(`getEnvironmentName()`, () => {
			expect(getEnvironmentName).toThrow("Environment Variable Missing: codeName,NODE_ENV");
		});

		const idKeys = [
			"homeServer",
			"rollem",
			"superAdmin",
			"superUser",
			"tupperBox",
			"Map",
		];

		idKeys.forEach(idKey => {
			test(tagLiterals`getId(${idKey}) throws`, () => {
				expect(() => getId(idKey)).toThrow(`Environment Variable Missing: ${idKey}Id`);
			});
		});

		idKeys.forEach(idKey => {
			test(tagLiterals`getId(${idKey}, true) === undefined`, () => {
				expect(() => getId(idKey, true)).not.toThrow();
				expect(getId(idKey, true)).toBeUndefined();
			});
		});

		const idsKeys = [
			"superAdmin"
		];

		idsKeys.forEach(idsKey => {
			test(tagLiterals`getIds(${idsKey}) throws`, () => {
				expect(() => getIds(idsKey)).toThrow(`Environment Variable Missing: ${idsKey}Ids`);
			});
		});

		idsKeys.forEach(idsKey => {
			test(tagLiterals`getIds(${idsKey}, true) === []`, () => {
				expect(() => getIds(idsKey, true)).not.toThrow();
				expect(getIds(idsKey, true)).toEqual([]);
			});
		});
	}

});
