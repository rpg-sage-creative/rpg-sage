import type { Optional, OrNull, OrUndefined } from "@rsc-utils/core-utils";
import type { MessageReaction, User } from "discord.js";
import type { MessageOrPartial, ReactionOrPartial, SMessage, UserOrPartial } from "../types/types.js";

export async function fetchIfPartial(value: MessageOrPartial): Promise<SMessage>;
export async function fetchIfPartial(value: ReactionOrPartial): Promise<MessageReaction>;
export async function fetchIfPartial(value: UserOrPartial): Promise<User>;

export async function fetchIfPartial(value: OrUndefined<MessageOrPartial>): Promise<OrUndefined<SMessage>>;
export async function fetchIfPartial(value: OrUndefined<ReactionOrPartial>): Promise<OrUndefined<MessageReaction>>;
export async function fetchIfPartial(value: OrUndefined<UserOrPartial>): Promise<OrUndefined<User>>;

export async function fetchIfPartial(value: OrNull<MessageOrPartial>): Promise<OrNull<SMessage>>;
export async function fetchIfPartial(value: OrNull<ReactionOrPartial>): Promise<OrNull<MessageReaction>>;
export async function fetchIfPartial(value: OrNull<UserOrPartial>): Promise<OrNull<User>>;

export async function fetchIfPartial(value: Optional<MessageOrPartial>): Promise<Optional<SMessage>>;
export async function fetchIfPartial(value: Optional<ReactionOrPartial>): Promise<Optional<MessageReaction>>;
export async function fetchIfPartial(value: Optional<UserOrPartial>): Promise<Optional<User>>;

/**
 * Performs a fetch only if the given object is a partial.
 * @todo check the fetch error specifically for a missing item.
 */
export async function fetchIfPartial<T extends MessageOrPartial | ReactionOrPartial | UserOrPartial>(value: Optional<T>): Promise<Optional<T>> {
	if (value?.partial) {
		return value.fetch().catch(() => undefined) as Promise<Optional<T>>;
	}
	return value;
}