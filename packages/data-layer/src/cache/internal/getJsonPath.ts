import { snowflakeToDate, type Snowflake } from "@rsc-utils/core-utils";
import { formatDataFilePath } from "@rsc-utils/core-utils";
import type { CacheItemTableName } from "../types.js";

/**
 * @internal
 * Reusable function to avoid typoes when getting json file path.
 */
export function getJsonPath(tableName: CacheItemTableName, id: string): string {
	const dataPath = ["sage", tableName];
	if (tableName === "messages") {
		dataPath.push(snowflakeToDate(id as Snowflake).getFullYear().toString());
	}
	return formatDataFilePath(dataPath, id);
}
