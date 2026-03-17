import { errorReturnUndefined, forEachAsync, getDataRoot, verbose } from "@rsc-utils/core-utils";
import { filterFiles, readJsonFile } from "@rsc-utils/io-utils";
import { assertSageCharacterCore } from "../../types/SageCharacterCore.js";
import { assertSageGameCore } from "../../types/SageGameCore.js";
import { assertSageMessageReferenceCore } from "../../types/SageMessageReferenceCore.js";
import { assertSageServerCore } from "../../types/SageServerCore.js";
import { assertSageUserCore } from "../../types/SageUserCore.js";
import { objectTypeToTableName, type CacheItemObjectType, type GlobalCacheItem } from "../types.js";

export async function validate<CacheItem extends GlobalCacheItem = GlobalCacheItem>(objectType: CacheItemObjectType, yearArgs?: string[]): Promise<boolean> {
	const errors: string[] = [];
	const invalid: string[] = [];
	let fileCount = 0;

	verbose(`ObjectType: ${objectType}`);

	const dataPath = getDataRoot(["sage", objectTypeToTableName(objectType)]);
	verbose(`  ${objectType} Path: ${dataPath}`);

	const children = objectType === "Message" ? yearArgs ?? ["2021", "2022", "2023", "2024", "2025", "2026"] : [""];
	if (children[0]) {
		verbose(`  ${objectType} Children: ${children}`);
	}

	for (const child of children) {
		const childPath = child ? getDataRoot(["sage", objectTypeToTableName(objectType), child]) : dataPath;
		if (child) {
			verbose(`  ${objectType} ${child} Path: ${childPath}`);
		}

		verbose(`  Counting ${objectType} ...`);
		const files = await filterFiles(childPath, { fileExt:"json", recursive:true });
		verbose(`                 ... ${files.length} found.`);

		fileCount += files.length;

		await forEachAsync(`    Validating ${child ? objectType + " " + child : objectType}`, files, async file => {
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
	verbose({ objectType, dataPath, files:fileCount, errors:errors.length, invalid:invalid.length });

	return !errors.length && !invalid.length;
}