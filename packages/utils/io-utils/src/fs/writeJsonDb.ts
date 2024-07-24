import { stringify } from "@rsc-utils/core-utils";
import { writeFile } from "./writeFile.js";

/**
 * Designed for reading a Foundry .db file that is a list of json items on each line, but not an array.
 */
export function writeJsonDb<T>(filePathAndName: string, values: T[], makeDir?: boolean): Promise<boolean> {
	const content = values.map(value => stringify(value)).join("\n");
	return writeFile(filePathAndName, content, makeDir);
}
