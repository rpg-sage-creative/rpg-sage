import type { Optional } from "@rsc-utils/type-utils";
import { validate } from "uuid";
import type { UUID } from "./types.js";

/** Returns true if a valid UUID string (regardless of case), or false otherwise. */
export function isUuid(value: Optional<string>): value is UUID {
	return validate(value);
}
