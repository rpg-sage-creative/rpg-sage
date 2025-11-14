import { enableLogLevels, getDataRoot, verbose } from "@rsc-utils/core-utils";
import { fileExistsSync, filterFiles } from "@rsc-utils/io-utils";

export async function initProcessor(what: "Messages" | "Users") {
	enableLogLevels("development");

	verbose(`Updating ${what} ...`);

	const dataRoot = fileExistsSync(`/Users/randaltmeyer`)
		? `/Users/randaltmeyer/tmp/data/sage/${what.toLowerCase()}`
		: getDataRoot(`sage/${what.toLowerCase()}`);
	verbose(`  ${what} Root: ${dataRoot}`);

	const files = await filterFiles(dataRoot, { fileExt:"json", recursive:true });
	verbose(`  ${what}: ${files.length}`);

	return { dataRoot, files };
}