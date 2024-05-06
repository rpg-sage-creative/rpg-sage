import type { Snowflake } from "@rsc-utils/snowflake-utils";
import { getFromProcess } from "./internal/getFromProcess.js";
import { isValidId } from "./internal/isValidId.js";

let _superAdminId: Snowflake;
export function getSuperAdminId(): Snowflake {
	if (!_superAdminId) {
		_superAdminId = getFromProcess(isValidId, "superAdminId");
	}
	return _superAdminId;
}