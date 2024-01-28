import type { Optional } from "@rsc-utils/type-utils";
import { isNilUuid } from "./isNilUuid.js";
import { isUuid } from "./isUuid.js";
import { type UUID } from "./types";

/** Returns true if the value is a nil UUID. */
export function isNonNilUuid(value: Optional<UUID>): value is UUID {
	return isUuid(value) && !isNilUuid(value);
}
