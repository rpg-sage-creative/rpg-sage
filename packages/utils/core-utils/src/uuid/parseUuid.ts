import type { Optional } from "../types/generics.js";
import type { UUID } from "./types.js";

/** A convenient method for grabbing the first UUID present in the string. */
export function parseUuid(value: Optional<string>): UUID | null {
	const regex = /(?<uuid>[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)/i;
	const match = regex.exec(value ?? "");
	return match?.groups?.uuid ?? null;
}