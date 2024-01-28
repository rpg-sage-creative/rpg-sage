import { randomUUID } from "crypto";
import type { UUID } from "./types.js";

/** Quickly generates a v4 UUID. */
export function randomUuid(): UUID {
	return randomUUID();
}