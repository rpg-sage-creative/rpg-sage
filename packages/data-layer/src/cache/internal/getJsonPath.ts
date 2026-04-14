import { formatDataFilePath, snowflakeToDate, type Snowflake } from "@rsc-utils/core-utils";
import type { CacheItemDirName } from "../types.js";

/**
 * @internal
 * Reusable function to avoid typoes when getting json file path.
 */
export function getJsonPath(dirName: CacheItemDirName, id: string): string {
	const dataPath = ["sage", dirName];
	if (dirName === "messages") {
		dataPath.push(snowflakeToDate(id as Snowflake).getUTCFullYear().toString());
	}
	return formatDataFilePath(dataPath, id);
}
