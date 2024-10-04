import { getId, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import type { CanBeSnowflakeResolvable } from "@rsc-utils/discord-utils";

/** Returns the known id for Tupperbox. */
export function getTupperBoxId(): Snowflake {
	return getId("tupperBox");
}

/** Returns true if we have a valid Tupperbox id. */
export function hasTupperBoxId(): boolean {
	return !!getTupperBoxId();
}

/** Convenient test and type guard for: id === getTupperBoxId() */
export function isTupperBoxId(id: Optional<CanBeSnowflakeResolvable>): id is Snowflake {
	const tupperId = getTupperBoxId();
	return tupperId && id ? id === getTupperBoxId() : false;
}