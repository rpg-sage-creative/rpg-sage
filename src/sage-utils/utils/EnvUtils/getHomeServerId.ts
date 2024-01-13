import type { Snowflake } from "discord.js";
import { getFromProcess } from "./internal/getFromProcess";
import { isValidId } from "./internal/isValidId";

let _homeServerId: Snowflake;
export function getHomeServerId(): Snowflake {
	if (!_homeServerId) {
		_homeServerId = getFromProcess(isValidId, "homeServerId");
	}
	return _homeServerId;
}