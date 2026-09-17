import type { Optional, OrUndefined } from "@rsc-utils/core-utils";
import { resolveUserId, type UserIdResolvable } from "../resolve/resolveUserId.js";

export function toUserUrl(user: UserIdResolvable): string;
export function toUserUrl(user: Optional<UserIdResolvable>): OrUndefined<string>;
export function toUserUrl(user: Optional<UserIdResolvable>): OrUndefined<string> {
	const userId = resolveUserId(user);
	return userId ? `https://discordapp.com/users/${userId}` : undefined;
}