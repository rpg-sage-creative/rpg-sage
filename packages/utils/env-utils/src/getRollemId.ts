import type { Snowflake } from "@rsc-utils/snowflake-utils";
import { getFromProcess } from "./internal/getFromProcess.js";
import { isValidId } from "./internal/isValidId.js";

let _rollemId: Snowflake;
export function getRollemId(): Snowflake {
	if (!_rollemId) {
		_rollemId = getFromProcess(isValidId, "rollemId");
	}
	return _rollemId;
}
