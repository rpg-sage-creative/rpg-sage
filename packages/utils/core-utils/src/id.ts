import type { Snowflake } from "./snowflake/types.js";
import type { Optional } from "./types/generics.js";
import type { UUID } from "./uuid/types.js";

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

export function decompressId<Type extends Snowflake | UUID>(value: string, radix?: number): Type;
export function decompressId<Type extends Snowflake | UUID>(value: Optional<string>, radix?: number): Type | undefined;
export function decompressId<Type extends Snowflake | UUID>(value: Optional<string>, radix = 36): Type | undefined {
	if (value) {
		if (value.includes("-")) {
			const lengths = [8, 4, 4, 4, 12];
			return value.split("-").map((s, i) => compressId(decompressId(s, radix), 16).padStart(lengths[i], "0")).join("-") as Type;
		}else {
			return value === "0"
				? "0".padEnd(16, "0") as Type
				: stringToBigInt(value, radix).toString() as Type
		}
	}
	return undefined;
}

export function stringToBigInt(value: string, radix: number): bigint {
	let size = 10,
		factor = BigInt(radix ** size),
		i = value.length % size || size,
		parts = [value.slice(0, i)];
	while (i < value.length) parts.push(value.slice(i, i += size));
	return parts.reduce((r, v) => r * factor + BigInt(parseInt(v, radix)), 0n);
}