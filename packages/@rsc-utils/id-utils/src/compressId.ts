import type { Optional } from "@rsc-utils/type-utils";
import { decompressId } from "./decompressId.js";
import type { Snowflake } from "./snowflake/types.js";
import type { UUID } from "./uuid/types.js";

/** Compresses a Snowflake or UUID into a smaller string by changing the radix of the number. */
export function compressId(value: Snowflake | UUID, radix?: number): string;
export function compressId(value: Optional<Snowflake | UUID>, radix?: number): string | undefined;
export function compressId(value: Optional<Snowflake | UUID>, radix = 36): string | undefined {
	if (value) {
		if (value.includes("-")) {
			return value.split("-").map(s => compressId(decompressId(s, 16), radix)).join("-");
		}
		return BigInt(value).toString(radix);
	}
	return undefined;
}
