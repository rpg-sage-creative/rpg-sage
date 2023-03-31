import { randomUUID } from "crypto";
import type { Optional } from "..";

//#region types

/** A nil UUID has all 0s. */
export type NIL_UUID = string & { nil_uuid:never; };

/** A normalized UUID has only lowercased letters, can also be Nil. */
export type NORMALIZED_UUID = string & { normalized_uuid:never; };

/** A valid UUID can have upper- and lowercased letters, can also be Nil. */
export type VALID_UUID = string & { valid_uuid:never; };

/** A valid UUID string of the format xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx */
export type UUID = string | NIL_UUID | NORMALIZED_UUID | VALID_UUID;

//#endregion

//#region consts

export const NIL_UUID = "00000000-0000-0000-0000-000000000000" as NIL_UUID;

//#endregion

// type X = '0'|'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'a'|'b'|'c'|'d'|'e'|'f';
// type _UUID_ = `${X}${X}${X}${X}${X}${X}${X}${X}-${X}${X}${X}${X}-4${X}${X}${X}-${X}${X}${X}${X}-${X}${X}${X}${X}${X}${X}${X}${X}${X}${X}${X}${X}`;

/** Returns true if a UUID of all zeros, false otherwise */
export function isNil(uuid: Optional<UUID>): uuid is NIL_UUID {
	return uuid === NIL_UUID;
}

/** Quickly generates a v4 UUID. */
export function generate(): VALID_UUID {
	return randomUUID() as VALID_UUID;
}

const uuidRegex = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

/** Returns true if NOT a valid UUID string (regardless of case), or false otherwise. */
export function isNotValid(uuid: Optional<UUID>): uuid is null | undefined | string {
	return typeof uuid !== "string" || !uuidRegex.test(uuid);
}

/** Returns true if a valid UUID string (regardless of case), or false otherwise. */
export function isValid(uuid: Optional<UUID>): uuid is VALID_UUID {
	return typeof uuid === "string" && uuidRegex.test(uuid);
}

/** Returns true if the value is a normalized UUID, false otherwise. */
export function isNotNormalized(uuid: UUID): uuid is string | VALID_UUID {
	return uuid !== normalize(uuid);
}

/** Returns true if the value is a normalized UUID, false otherwise. */
export function isNormalized(uuid: UUID): uuid is NORMALIZED_UUID {
	return uuid === normalize(uuid);
}

/** Returns a properly lowercased valid UUID, or NilUuid otherwise. */
export function normalize(uuid: Optional<UUID>): NORMALIZED_UUID | NIL_UUID {
	return isValid(uuid) ? uuid.toLowerCase() as NORMALIZED_UUID : NIL_UUID;
}

/** Returns true if the two given values both exist, are valid, and are equal to each other. */
export function equals(a: UUID, b: UUID): boolean {
	return isValid(a) && isValid(b) && a.toLowerCase() === b.toLowerCase();
}
