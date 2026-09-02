import { getId, type Optional, type Snowflake } from "@rsc-utils/core-utils";

export function getSageId(): Snowflake {
	return getId("bot");
}

export function isSageId(id: Optional<string>): id is Snowflake {
	return getSageId() === id;
}