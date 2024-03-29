import type { Optional } from "@rsc-utils/type-utils";
import type { UUID } from "./types.js";

/** Returns true if a valid UUID string (regardless of case), or false otherwise. */
export function isUuid(value: Optional<UUID>): value is UUID {
	if (value) {
		const regex = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
		return regex.test(value);
	}
	return false;
}
