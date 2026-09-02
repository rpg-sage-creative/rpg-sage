import type { EnumLike } from "@rsc-utils/core-utils";

export function ensureEnum<Key extends string, Value extends number>(enumObject: EnumLike<Key, Value>, value?: number): number | undefined;
export function ensureEnum(enumObject: Record<string | number, string | number>, value?: number): number | undefined {
	return typeof(value) === "number" && value in enumObject
		&& typeof(enumObject[value]) === "string" && enumObject[enumObject[value]] === value
		? value : undefined;
}