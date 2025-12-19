import { getId, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import type { CanBeSnowflakeResolvable } from "../resolve/resolveSnowflake.js";

/** Returns the known id for Tupperbox. */
export function getTupperBoxId(): Snowflake {
	return getId("tupperBox");
}

/** Convenient test and type guard for: id === getTupperBoxId() */
export function isTupperBoxId(id: Optional<CanBeSnowflakeResolvable>): id is Snowflake {
	const tupperId = getTupperBoxId();
	return tupperId && id ? id === getTupperBoxId() : false;
}