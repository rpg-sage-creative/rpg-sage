import type { Message, MessageReaction, User } from "discord.js";
import type { MessageOrPartial, ReactionOrPartial, UserOrPartial } from "../types/types.js";
import type { Optional, OrNull, OrUndefined } from "@rsc-utils/core-utils";

export async function fetchIfPartial(value: OrUndefined<MessageOrPartial>): Promise<OrUndefined<Message>>;
export async function fetchIfPartial(value: OrUndefined<ReactionOrPartial>): Promise<OrUndefined<MessageReaction>>;
export async function fetchIfPartial(value: OrUndefined<UserOrPartial>): Promise<OrUndefined<User>>;

export async function fetchIfPartial(value: OrNull<MessageOrPartial>): Promise<OrNull<Message>>;
export async function fetchIfPartial(value: OrNull<ReactionOrPartial>): Promise<OrNull<MessageReaction>>;
export async function fetchIfPartial(value: OrNull<UserOrPartial>): Promise<OrNull<User>>;

export async function fetchIfPartial(value: Optional<MessageOrPartial>): Promise<Optional<Message>>;
export async function fetchIfPartial(value: Optional<ReactionOrPartial>): Promise<Optional<MessageReaction>>;
export async function fetchIfPartial(value: Optional<UserOrPartial>): Promise<Optional<User>>;

/** @todo check the fetch error specifically for a missing item */
export async function fetchIfPartial<T extends MessageOrPartial | ReactionOrPartial | UserOrPartial>(value: Optional<T>): Promise<Optional<T>> {
	if (value?.partial) {
		return value.fetch().catch(() => undefined) as Promise<Optional<T>>;
	}
	return value;
}