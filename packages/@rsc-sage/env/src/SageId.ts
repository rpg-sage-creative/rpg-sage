import type { Snowflake } from "@rsc-utils/id-utils";
import type { Optional } from "@rsc-utils/type-utils";
import { getId } from "./getId.js";

export function getSageId(): Snowflake {
	return getId("bot");
}

export function isSageId(id: Optional<string>): id is Snowflake {
	return getSageId() === id;
}