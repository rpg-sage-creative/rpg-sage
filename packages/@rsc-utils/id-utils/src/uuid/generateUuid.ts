import { v7 } from "uuid";
import type { STRICT_UUID } from "./types.js";

type UuidArgs = {
	/** sequence number for generating mulitple UUID values for a specific timestamp */
	seq?: bigint | number;
	/** the timestamp to use as the date portion of the UUID */
	ts?: bigint | Date | number;
};

/**
 * A convenience method for uuid.v7().
 * Why? ... Sometimes I am lazy and only want one import in my file.
 * This way I can import { isUuid, generateUuid } from "@rsc-utils/core-utils" instead of needing to also import from uuid.
*/
export function generateUuid(args?: UuidArgs): STRICT_UUID {
	const msecs = typeof(args?.ts) === "bigint" ? +args.ts.toString() || undefined : +(args?.ts as Date) || undefined;
	const seq = typeof(args?.seq) === "bigint" ? +args.seq.toString() || undefined : args?.seq;
	return v7({ msecs, seq }) as STRICT_UUID;
}

/** @deprecated use generateUuid() */
export const randomUuid = generateUuid;