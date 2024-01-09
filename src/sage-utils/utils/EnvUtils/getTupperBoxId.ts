import type { Snowflake } from "discord.js";
import { getFromProcess } from "./internal/getFromProcess";
import { isValidId } from "./internal/isValidId";

let _tupperBoxId: Snowflake;
export function getTupperBoxId(): Snowflake {
	if (!_tupperBoxId) {
		_tupperBoxId = getFromProcess(isValidId, "tupperBoxId");
	}
	return _tupperBoxId;
}
