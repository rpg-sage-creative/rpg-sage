import { orNilSnowflake, type Optional } from "@rsc-utils/core-utils";
import { isSageId } from "@rsc-utils/discord-utils";
import type { SageEventCache } from "../SageEventCache.js";
import { User } from "../User.js";

let _userForSage: User | undefined;

export async function getOrCreateUser(eventCache: SageEventCache, id: Optional<string>): Promise<User> {
	const userId = orNilSnowflake(id);

	if (isSageId(userId)) {
		return _userForSage ??= new User(User.createCore(userId), eventCache);
	}

	let user: User | undefined;

	// check cache first
	user = await eventCache.getOrFetchUser(userId);

	// create a new one
	user ??= new User(User.createCore(userId), eventCache);

	return user;
}