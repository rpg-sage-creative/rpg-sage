import { getId, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import type { CanBeSnowflakeResolvable } from "@rsc-utils/discord-utils";

export function getSageId(): Snowflake {
	return getId("bot");
}

export function isSageId(id: Optional<CanBeSnowflakeResolvable>): id is Snowflake {
	return getSageId() === id;
}