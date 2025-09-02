import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import type { Guild } from "discord.js";
import type { SageEventCache } from "../SageEventCache.js";
import { Server } from "../Server.js";

export type KnownServer = {
	discord: Guild;
	id: Snowflake;
	isDm: false;
	isServer: true;
	known: true;
	ownerId: Snowflake;
	sage: Server;
};

export type UnknownServer = {
	discord?: Guild;
	id?: Snowflake;
	isDm: false;
	isServer: true;
	known: false;
	ownerId?: Snowflake;
	sage?: Server;
};

export type DmServer = {
	discord?: never;
	id?: never;
	isDm: true;
	isServer: false;
	known: false;
	ownerId?: never;
	sage?: never;
};

export type UnvalidatedServer = {
	discord?: Guild;
	id?: never;
	isDm?: never;
	isServer?: never;
	known?: never;
	ownerId?: never;
	sage?: never;
};

export type SageEventCacheServer = UnvalidatedServer | DmServer | UnknownServer | KnownServer;


export async function validateServer(evCache: SageEventCache, discord: Optional<Guild>): Promise<SageEventCacheServer> {
	// no guild means dm
	if (!discord) {
		const dmServer: DmServer = {
			isDm: true,
			isServer: false,
			known: false
		};
		return dmServer;
	}

	// type cast id
	const id = discord.id as Snowflake;

	// what means unkonwn, failed fetch ?
	// const unkonwnServer = { };
	// return unknownServer;

	// fetch sage object
	let sage = await evCache.getOrFetchServer(discord.id);

	// we didn't find one, so create one
	if (!sage) {
		sage = new Server(Server.createCore(discord), evCache);
	}

	// if the names don't match (new server or a change) then update and save
	if (sage.name !== discord.name) {
		sage.toJSON().name = discord.name;
		/** @todo we don't need the result of this save so we could fire it and not wait */
		await sage.save();
	}

	const knownServer: KnownServer = {
		discord,
		id,
		isDm: false,
		isServer: true,
		known: true,
		ownerId: discord.ownerId as Snowflake,
		sage,
	}
	return knownServer;
}
