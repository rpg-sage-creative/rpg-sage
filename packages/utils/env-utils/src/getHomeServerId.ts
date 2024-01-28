import type { Snowflake } from "@rsc-utils/snowflake-utils";
import { getFromProcess } from "./internal/getFromProcess.js";
import { isValidId } from "./internal/isValidId.js";

let _homeServerId: Snowflake;
export function getHomeServerId(): Snowflake {
	if (!_homeServerId) {
		_homeServerId = getFromProcess(isValidId, "homeServerId");
	}
	return _homeServerId;
}