import type { Optional } from "@rsc-utils/type-utils";
import type { STRICT_UUID } from "./types.js";
import { UuidRegExp } from "./UuidRegExp.js";

/** A convenient method for grabbing the first UUID present in the string. */
export function parseUuid(value: Optional<string>): STRICT_UUID | undefined {
	return typeof(value) === "string" ? UuidRegExp.exec(value)?.groups?.uuid.toLowerCase() : undefined;
}