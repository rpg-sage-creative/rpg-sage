import type { Snowflake } from "@rsc-utils/id-utils";
import type { Optional } from "@rsc-utils/type-utils";
import { getId } from "./getId.js";

/** Returns the known id for Tupperbox. */
export function getTupperBoxId(): Snowflake {
	return getId("tupperBox");
}

/** Convenient test and type guard for: id === getTupperBoxId() */
export function isTupperBoxId(id: Optional<string>): id is Snowflake {
	const tupperId = getTupperBoxId();
	return tupperId && id ? id === getTupperBoxId() : false;
}