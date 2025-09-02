import { BULLET, error, isErrorLike, parseUuid, stringifyJson, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { getSuperAdminIds, getSuperUserId, isDiscordApiError, toHumanReadable, type MessageOrPartial, type ReactionOrPartial, type UserOrPartial } from "@rsc-utils/discord-utils";
import type { User as DUser, GuildMember } from "discord.js";
import { GameUserType } from "../Game.js";
import type { SageEventCache } from "../SageEventCache.js";
import { AdminRoleType, GameCreatorType, SuperAccessType } from "../Server.js";
import { User } from "../User.js";
import { getOrCreateUser } from "./getOrCreateUser.js";

export type KnownUser = {
	/** was given Sage's GameCreator role */
	canCreateGames: boolean;
	/** was given Sage's GameAdmin role */
	canManageGames: boolean;
	/** Discord Guild: Owner, Administrator, ManageGuild */
	canManageServer: boolean;

	discord: DUser;
	id: Snowflake;

	isGameMaster: boolean;
	isGamePlayer: boolean;
	/** isGameMaster || isGamePlayer */
	isGameUser: boolean;

	known: true;
	member?: GuildMember;
	sage: User;
	uuid?: UUID;
};

export type UnknownUser = {
	canCreateGames: false;
	canManageGames: false;
	canManageServer: false;
	discord?: DUser;
	id?: Snowflake;
	isGameMaster: false;
	isGamePlayer: false;
	isGameUser: false;
	known: false;
	member?: GuildMember;
	sage: User;
	uuid?: never;
};

export type UnvalidatedUser = {
	canCreateGames?: never;
	canManageGames?: never;
	canManageServer?: never;
	discord?: never;
	id?: never;
	isGameMaster?: never;
	isGamePlayer?: never;
	isGameUser?: never;
	known?: never;
	member?: never;
	sage: User;
	uuid?: never;
};

export type SageEventCacheUser = UnvalidatedUser | UnknownUser | KnownUser;

type ValidateActorArgs = {
	which: "actor";
	actorOrPartial?: UserOrPartial;
	authorOrPartial?: never;
	messageOrPartial?: MessageOrPartial;
	reactionOrPartial?: ReactionOrPartial;
};

type ValidateAuthorArgs = {
	which: "author";
	actorOrPartial?: never;
	authorOrPartial?: UserOrPartial;
	messageOrPartial?: MessageOrPartial;
	reactionOrPartial?: ReactionOrPartial;
};

type ValidateUserArgs = ValidateActorArgs | ValidateAuthorArgs;

export async function validateUser(evCache: SageEventCache, validateUserArgs: ValidateUserArgs): Promise<SageEventCacheUser> {
	const { which, actorOrPartial, authorOrPartial, messageOrPartial, reactionOrPartial } = validateUserArgs;

	let discord: DUser | undefined;
	let { discord:guild, sage:server } = evCache.server;

	const validationErrors: string[] = [];
	const appendError = (action: string, err: unknown) => {
		validationErrors.push(`Error Validating User (SageEventCache.ts -> validateUser)`);
		validationErrors.push(`${BULLET} ${action}`);
		if (discord) {
			validationErrors.push(`${BULLET} discord = ${discord.id} (${toHumanReadable(discord)})`);
		}
		if (guild) {
			validationErrors.push(`${BULLET} guild = ${guild.id} (${guild.name})`);
		}
		if (isDiscordApiError(err, 10007, 10013)) {
			const errName = {10007:"Unknown Member",10013:"Unknown User"}[err.code];
			validationErrors.push(`${BULLET} DiscordApiError ${err.code} (${errName})`)
		}else if (isErrorLike(err)) {
			validationErrors.push(`${BULLET} ${err.name ?? "NoName"}: ${err.message ?? "NoMessage"}`);
		}else if (err) {
			validationErrors.push(`${BULLET} ${stringifyJson(err)}`);
		}
		return undefined;
	};
	const sendErrors = () => {
		if (validationErrors.length > 0) {
			error(validationErrors.join("\n"));
		}
	};

	// try fetching the discord user object
	discord = await (actorOrPartial ?? authorOrPartial)?.fetch().catch(err => appendError(`discord = await (actorOrPartial ?? authorOrPartial)?.fetch()`, err));

	// actor will always get passed in, author might not if the original was a partial
	if (!discord && which === "author") {
		// if we don't have a reaction and have a message, try getting author directly from message
		if (!reactionOrPartial && messageOrPartial) {
			const message = await messageOrPartial.fetch().catch(err => appendError(`const message = await messageOrPartial.fetch()`, err));
			discord = message?.author;
		}

		// still no discord user and we have a reaction, try getting it from reaction's message
		if (!discord && reactionOrPartial) {
			const reaction = await reactionOrPartial.fetch().catch(err => appendError(`const reaction = await reactionOrPartial.fetch()`, err));
			const message = await reaction?.message.fetch().catch(err => appendError(`const message = await reaction?.message.fetch()`, err));
			discord = message?.author;
		}

		// in case we managed to still have a partial ...
		discord = await discord?.fetch().catch(err => appendError(`discord = await discord?.fetch()`, err));
	}

	// we want to always have a sage user object, so pass in nil if we don't have an id
	const sage = await getOrCreateUser(evCache, discord?.id);

	// set flags as false by default
	let canCreateGames = false;
	let canManageGames = false;
	let canManageServer = false;
	let isGameMaster = false;
	let isGamePlayer = false;
	let isGameUser = false;

	// we don't have a valid discord user (or we couldn't fetch it for some reason)
	if (!discord?.id) {
		const unknownUser: UnknownUser = {
			canCreateGames,
			canManageGames,
			canManageServer,
			// discord: undefined,
			// id: undefined,
			isGameMaster,
			isGamePlayer,
			isGameUser,
			known: false,
			// member: undefined,
			sage,
			// uuid: undefined,
		};
		sendErrors();
		return unknownUser;
	}

	// type cast id now
	const id = discord.id as Snowflake;
	const roleIds: Snowflake[] = [];

	// early and easiest check for canManageServer
	if (server?.superAccessType) {
		canManageServer = id === getSuperUserId()
			|| (server.superAccessType === SuperAccessType.SuperAdmin && getSuperAdminIds().includes(id));
	}

	// we need a guildmember to check server perms
	let member: GuildMember | undefined;
	guild = await guild?.fetch().catch(err => appendError(`guild = await guild?.fetch()`, err));
	if (guild) {
		// fetch the guild member if it isn't a bot and isn't a system user
		if (!discord.bot && !discord.system) {
			member = await guild.members.fetch(id).catch(err => appendError(`member = await guild.members.fetch(id)`, err));
			if (member) {
				roleIds.push(...member.roles.cache.keys() as MapIterator<Snowflake>);
			}
		}

		// check the guild member for owner/admin/manage perms
		canManageServer ||= guild.ownerId === id
			|| member?.permissions.has("Administrator") === true
			|| member?.permissions.has("ManageGuild") === true;
	}

	// if you can canManageServer you can do these as well
	if (canManageServer) {
		canCreateGames = true;
		canManageGames = true;
	}

	// const hasRole = (roleId?: Snowflake) => roleId ? member?.roles.cache.has(roleId) ?? false : false;

	if (server) {
		// update "can" flags if needed
		canCreateGames ||= server.gameCreatorType ? server.gameCreatorType === GameCreatorType.Any : server.hasAdmin(id, roleIds, AdminRoleType.GameCreator);
		canManageGames ||= server.hasAdmin(id, roleIds, AdminRoleType.GameAdmin);
	}

	// now let's check for game access
	const { game } = evCache;
	if (game) {
		// NOTE: hasUser checks users and roles so is preferred
		isGameMaster = game.hasUser(id, roleIds, GameUserType.GameMaster);
		isGamePlayer = game.hasUser(id, roleIds, GameUserType.Player);
		isGameUser = isGameMaster || isGamePlayer;
	}

	// keep getting uuid until we completely phase it out
	const uuid = parseUuid(sage.toJSON().uuid ?? sage.id);

	const knownUser: KnownUser = {
		canCreateGames,
		canManageGames,
		canManageServer,
		discord,
		id,
		isGameMaster,
		isGamePlayer,
		isGameUser,
		known: true,
		member,
		sage,
		uuid,
	};
	sendErrors();
	return knownUser;
}
