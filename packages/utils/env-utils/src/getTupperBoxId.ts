import type { Snowflake } from "@rsc-utils/snowflake-utils";
import { getFromProcess } from "./internal/getFromProcess.js";
import { isValidId } from "./internal/isValidId.js";

let _tupperBoxId: Snowflake;
export function getTupperBoxId(): Snowflake {
	if (!_tupperBoxId) {
		_tupperBoxId = getFromProcess(isValidId, "tupperBoxId");
	}
	return _tupperBoxId;
}
