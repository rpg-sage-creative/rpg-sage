import type { Optional } from "@rsc-utils/type-utils";
import { NIL, validate } from "uuid";
import type { UUID } from "./types.js";

/** Returns true if the value is a nil UUID. */
export function isNonNilUuid(value: Optional<string>): value is UUID {
	return validate(value) && value !== NIL;
}
