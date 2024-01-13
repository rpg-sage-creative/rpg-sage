import type { Snowflake } from "discord.js";
import { getFromProcess } from "./internal/getFromProcess";
import { isValidId } from "./internal/isValidId";

let _superUserId: Snowflake;
export function getSuperUserId(): Snowflake {
	if (!_superUserId) {
		_superUserId = getFromProcess(isValidId, "superUserId");
	}
	return _superUserId;
}