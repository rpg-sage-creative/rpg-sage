import type { Optional } from "../types/generics.js";
import { isNilUuid } from "./isNilUuid.js";
import { isUuid } from "./isUuid.js";
import type { UUID } from "./types.js";

/** Returns true if the value is a nil UUID. */
export function isNonNilUuid(value: Optional<string>): value is UUID {
	return isUuid(value) && !isNilUuid(value);
}
