import type { Optional } from "@rsc-utils/type-utils";
import { NIL_UUID, type UUID } from "./types";

/** Returns true if the value is a nil UUID. */
export function isNilUuid(value: Optional<UUID>): value is NIL_UUID {
	return value === NIL_UUID;
}
