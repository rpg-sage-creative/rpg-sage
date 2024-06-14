import { randomUUID } from "crypto";
import type { UUID } from "./types.js";

/**
 * A convenience method for randomUUID.
 * Why? ... Sometimes I am lazy and only want one import in my file.
 * This way I can import { isUuid, randomUuid } from "@rsc-utils/core-utils" instead of needing to also import from crypto.
*/
export function randomUuid(): UUID {
	return randomUUID();
}