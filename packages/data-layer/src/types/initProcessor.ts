import { enableLogLevels, getDataRoot, verbose } from "@rsc-utils/core-utils";
import { filterFiles } from "@rsc-utils/io-utils";

export async function initProcessor(what: "Messages" | "Users") {
	enableLogLevels("development");

	verbose(`Updating ${what} ...`);

	const dataRoot = getDataRoot(`sage/${what.toLowerCase()}`);
	verbose(`  ${what} Root: ${dataRoot}`);

	const files = await filterFiles(dataRoot, { fileExt:"json", recursive:true });
	verbose(`  ${what}: ${files.length}`);

	return { dataRoot, files };
}