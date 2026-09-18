import type { Optional } from "@rsc-utils/type-utils";
import { validate } from "uuid";
import { NIL_UUID, type STRICT_UUID } from "./types.js";

/** Returns a strict UUID (lowerCase) if it is a valid UUID, otherwise it returns NIL_UUID. */
export function orNilUuid(value: Optional<string>): STRICT_UUID {
	return validate(value) ? value!.toLowerCase() as STRICT_UUID : NIL_UUID;
}
