import { sortPrimitive } from "@rsc-utils/array-utils";
import type { Snowflake } from "@rsc-utils/core-utils";
import type { LocalizedTextKey } from "../../../../../sage-lang/getLocalizedText.js";
import type { SageCommand } from "../../../model/SageCommand.js";

export enum MacroOwnerType {
	character,
	user,
	game,
	server,
	global
}

export type MacroOwnerTypeKey = keyof typeof MacroOwnerType;

export type MacroOwner = {
	id: Snowflake;
	type: MacroOwnerTypeKey;
}

type OwnerType = {
	type: MacroOwnerTypeKey;
	typeKey: LocalizedTextKey;
	pluralKey: LocalizedTextKey;
};

export function getOwnerTypes(): OwnerType[] {
	return [
		{ type:"character", typeKey:"CHARACTER_MACROS", pluralKey:"CHARACTERS" },
		{ type:"user", typeKey:"USER_MACROS", pluralKey:"USERS" },
		{ type:"game", typeKey:"GAME_MACROS", pluralKey:"GAMES" },
		{ type:"server", typeKey:"SERVER_MACROS", pluralKey:"SERVERS" },
		{ type:"global", typeKey:"GLOBAL_MACROS", pluralKey:"GLOBAL" },
	];
}

export function getOwnerType(ownerType?: MacroOwnerTypeKey): OwnerType | undefined {
	return getOwnerTypes().find(owner => owner.type === ownerType);
}

export type NamedOwner = MacroOwner & { name:string; };

function getCharacters(sageCommand: SageCommand): NamedOwner[] {
	const { actorId } = sageCommand;
	const type = "character";
	if (sageCommand.game) {
		if (sageCommand.isGameMaster) {
			return sageCommand.game.nonPlayerCharacters.map(pc => ({ id:pc.id, name:pc.name, type }));
		}
		return sageCommand.game.playerCharacters.filter(pc => pc.userDid === actorId).map(pc => ({ id:pc.id, name:pc.name, type }));
	}
	return sageCommand.sageUser.playerCharacters.map(pc => ({ id:pc.id, name:pc.name, type }));
}

function getGames(sageCommand: SageCommand): NamedOwner[] {
	const type = "game";
	const { game } = sageCommand;
	if (game) {
		return [{ id:game.id as Snowflake, name:game.name, type }];
	}else {
		// const serverId = sageCommand.server.did;
		// const userId = sageCommand.canAdminGames ? undefined : sageCommand.actorId;
		// const games = await sageCommand.sageCache.games.fetch({ serverId, userId });
		return [];
	}
}

export function getOwners(sageCommand: SageCommand, type: MacroOwnerTypeKey): NamedOwner[] {
	const { actorId } = sageCommand;
	let owners: NamedOwner[];
	switch(type) {
		case "character": owners = getCharacters(sageCommand); break;
		case "user": owners = [{ id:actorId, name:"@Me", type }]; break;
		case "game": owners = getGames(sageCommand); break;
		case "server":owners = [{ id:sageCommand.server.did, name:sageCommand.server.name, type }]; break;
		case "global":owners = [{ id:sageCommand.bot.did, name:"RPG Sage", type }]; break;
		default: owners = []; break;
	}
	owners.sort((a, b) => sortPrimitive(a.name, b.name));
	return owners;
}