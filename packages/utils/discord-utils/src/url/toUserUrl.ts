import type { Optional, OrNull } from "@rsc-utils/type-utils";
import type { DUserResolvable } from "../types.js";

export function toUserUrl(user: DUserResolvable): string;
export function toUserUrl(user: Optional<DUserResolvable>): OrNull<string>;
export function toUserUrl(user: Optional<DUserResolvable>): OrNull<string> {
	const userId = typeof(user) === "string" ? user : user?.id;
	return userId ? `https://discordapp.com/users/${userId}` : null;
}