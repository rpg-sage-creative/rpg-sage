import type { Optional } from "..";
import { NIL_UUID, type NilUuid, type NormalizedUuid, type UUID, type ValidUuid } from "./types";

/** Returns true if a valid UUID string (regardless of case), or false otherwise. */
export function isUuid(value: Optional<string>): value is ValidUuid {
	const match = value?.match(/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i);
	return match !== null;
}

/** Returns true if a UUID of all zeros, false otherwise */
export function isNilUuid(value: Optional<string>): value is NilUuid {
	return value === NIL_UUID;
}

/** Returns true if the value is a valid non-nil UUID. */
export function isNonNilUuid(value: Optional<string>): value is ValidUuid {
	return !isNilUuid(value) && isUuid(value);
}

/** Returns a properly lowercased valid UUID, or NilUuid otherwise. */
export function orNilUuid(uuid: Optional<UUID>): NormalizedUuid | NilUuid {
	return isUuid(uuid) ? uuid.toLowerCase() as NormalizedUuid : NIL_UUID;
}

/** Returns true if the two given values both exist, are valid, and are equal to each other. */
export function equals(a: UUID, b: UUID): boolean {
	return isUuid(a) && orNilUuid(a) === orNilUuid(b);
}
