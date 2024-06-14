import { type Optional, type OrNull } from "@rsc-utils/core-utils";
import { type UserIdResolvable } from "../types.js";

export function toUserUrl(user: UserIdResolvable): string;
export function toUserUrl(user: Optional<UserIdResolvable>): OrNull<string>;
export function toUserUrl(user: Optional<UserIdResolvable>): OrNull<string> {
	const userId = typeof(user) === "string" ? user : user?.id;
	return userId ? `https://discordapp.com/users/${userId}` : null;
}