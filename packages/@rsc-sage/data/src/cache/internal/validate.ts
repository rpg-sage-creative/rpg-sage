import { getDataRoot } from "@rsc-sage/env";
import { Arrayish } from "@rsc-utils/collection-utils";
import { filterFiles, readJsonFile } from "@rsc-utils/fs-utils";
import { errorReturnUndefined, Logger } from "@rsc-utils/logger-utils";
import { assertSageCharacterCore } from "../../types/SageCharacterCore.js";
import { assertSageGameCore } from "../../types/SageGameCore.js";
import { assertSageMessageReferenceCore } from "../../types/SageMessageReferenceCore.js";
import { assertSageServerCore } from "../../types/SageServerCore.js";
import { assertSageUserCore } from "../../types/SageUserCore.js";
import { objectTypeToDirName, type BaseCacheItem, type CacheItemObjectType } from "../types.js";

export async function validate<CacheItem extends BaseCacheItem = BaseCacheItem>(objectType: CacheItemObjectType, yearArgs?: string[]): Promise<boolean> {
	const errors: string[] = [];
	const invalid: string[] = [];
	let fileCount = 0;

	Logger.package("@rsc-sage/data").trace(`ObjectType: ${objectType}`);

	const dirName = objectTypeToDirName(objectType);

	const dataPath = getDataRoot(["sage", dirName]);
	Logger.package("@rsc-sage/data").trace(`  ${objectType} Path: ${dataPath}`);

	const children = objectType === "Message" ? yearArgs ?? ["2021", "2022", "2023", "2024", "2025", "2026"] : [""];
	if (children[0]) {
		Logger.package("@rsc-sage/data").trace(`  ${objectType} Children: ${children}`);
	}

	for (const child of children) {
		const childPath = child ? getDataRoot(["sage", dirName, child]) : dataPath;
		if (child) {
			Logger.package("@rsc-sage/data").trace(`  ${objectType} ${child} Path: ${childPath}`);
		}

		Logger.package("@rsc-sage/data").trace(`  Counting ${objectType} ...`);
		const files = await filterFiles(childPath, { fileExt:"json", recursive:true });
		Logger.package("@rsc-sage/data").trace(`                 ... ${files.length} found.`);

		fileCount += files.length;

		await Arrayish.async(files).forEach(async file => {
			const core = await readJsonFile<CacheItem>(file).catch(errorReturnUndefined);
			if (!core) {
				errors.push(file);
			}else {
				switch(objectType) {
					case "Character": if (!assertSageCharacterCore(core)) invalid.push(file); break;
					case "Game": if (!assertSageGameCore(core)) invalid.push(file); break;
					case "Message": if (!assertSageMessageReferenceCore(core)) invalid.push(file); break;
					case "Server": if (!assertSageServerCore(core)) invalid.push(file); break;
					case "User": if (!assertSageUserCore(core)) invalid.push(file); break;
				}
			}
		});
	}

	// send to the logs so we can see if something is amiss
	Logger.package("@rsc-sage/data").trace({ objectType, dataPath, files:fileCount, errors:errors.length, invalid:invalid.length });

	return !errors.length && !invalid.length;
}