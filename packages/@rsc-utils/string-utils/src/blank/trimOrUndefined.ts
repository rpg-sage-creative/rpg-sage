import type { Optional } from "@rsc-utils/type-utils";

/** Returns a trimmed non-blank string or undefined. */
export function trimOrUndefined(value: Optional<string>): string | undefined {
	const trimmed = value?.trim();
	return trimmed?.length ? trimmed : undefined;
}