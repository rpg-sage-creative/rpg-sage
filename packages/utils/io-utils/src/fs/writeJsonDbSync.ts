import { stringify } from "@rsc-utils/core-utils";
import { writeFileSync } from "./writeFileSync.js";

/**
 * Designed for reading a Foundry .db file that is a list of json items on each line, but not an array.
 */
export function writeJsonDbSync<T>(filePathAndName: string, values: T[], makeDir?: boolean): boolean {
	const content = values.map(value => stringify(value)).join("\n");
	return writeFileSync(filePathAndName, content, makeDir);
}
