import type { Optional } from "@rsc-utils/type-utils";
import { MAX } from "uuid";
import type { MAX_UUID } from "./types.js";

/** Returns true if the value is a nil UUID. */
export function isMaxUuid(value: Optional<string>): value is MAX_UUID {
	return value === MAX;
}
