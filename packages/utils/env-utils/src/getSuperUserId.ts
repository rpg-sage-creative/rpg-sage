import type { Snowflake } from "@rsc-utils/snowflake-utils";
import { getFromProcess } from "./internal/getFromProcess.js";
import { isValidId } from "./internal/isValidId.js";

let _superUserId: Snowflake;
export function getSuperUserId(): Snowflake {
	if (!_superUserId) {
		_superUserId = getFromProcess(isValidId, "superUserId");
	}
	return _superUserId;
}