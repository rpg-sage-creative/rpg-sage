import { sortPrimitive } from "@rsc-utils/array-utils";
import type { Snowflake } from "@rsc-utils/core-utils";
import type { LocalizedTextKey } from "../../../sage-lang/getLocalizedText.js";
import type { Macro } from "./Macro.js";
import type { SageCommand } from "./SageCommand.js";

export enum MacroOwnerType {
	character,
	user,
	game,
	server,
	global
}

export type MacroOwnerTypeKey = keyof typeof MacroOwnerType;
type TypeKey = LocalizedTextKey & `${Uppercase<MacroOwnerTypeKey>}_MACROS`;
type SingularKey = LocalizedTextKey & Uppercase<MacroOwnerTypeKey>;
type PluralKey = LocalizedTextKey & (`${SingularKey}S` | "GLOBAL");

type MacroOwnerLabels = {
	type: MacroOwnerTypeKey;
	typeKey: TypeKey;
	pluralKey: PluralKey;
	singularKey: SingularKey;
};

async function getCharacters(sageCommand: SageCommand): Promise<MacroOwner[]> {
	const { actorId } = sageCommand;
	const charToOwner = ({ id, name }: { id:Snowflake; name:string; }) => new MacroOwner(id, name, "character");
	if (sageCommand.game) {
		const pcs = sageCommand.game.playerCharacters.filter(pc => pc.userDid === actorId).map(charToOwner);
		if (!sageCommand.isGameMaster) {
			return pcs;
		}
		const npcs = sageCommand.game.nonPlayerCharacters.map(charToOwner);
		return pcs.concat(npcs);
	}
	return sageCommand.sageUser.playerCharacters.map(charToOwner);
}

async function getGames(sageCommand: SageCommand): Promise<MacroOwner[]> {
	/** @todo sort out this id cast */
	const gameToOwner = ({ id, name }: { id:unknown; name:string; }) => new MacroOwner(id as Snowflake, name, "game");
	if (sageCommand.canAdminGames) {
		const serverId = sageCommand.server.did;
		const userId = sageCommand.canAdminGames ? undefined : sageCommand.actorId;
		const games = await sageCommand.sageCache.games.fetch({ serverId, userId });
		return games.map(gameToOwner);
	}else if (sageCommand.game && (sageCommand.isGameMaster || sageCommand.isPlayer)) {
		return [gameToOwner(sageCommand.game)];
	}
	return [];
}

export type TMacroOwner = {
	id: Snowflake;
	type: MacroOwnerTypeKey;
}

export class MacroOwner {

	public pluralKey: LocalizedTextKey;
	public typeKey: LocalizedTextKey;

	public constructor(public id: Snowflake, public name: string, public type: MacroOwnerTypeKey) {
		const { pluralKey, typeKey } = MacroOwner.getLabel(type);
		this.pluralKey = pluralKey;
		this.typeKey = typeKey;
	}

	public static async findOwner(sageCommand: SageCommand, macro: Macro): Promise<MacroOwner | undefined> {
		const owners = await MacroOwner.getByType(sageCommand, macro.owner.type);
		for (const owner of owners) {
			if (owner.id === macro.owner.id) {
				return owner;
			}
		}
		return undefined;
	}

	public static async getByType(sageCommand: SageCommand, type: MacroOwnerTypeKey): Promise<MacroOwner[]> {
		const { actorId } = sageCommand;
		let owners: MacroOwner[];
		switch(type) {
			case "character": owners = await getCharacters(sageCommand); break;
			case "user": owners = [new MacroOwner(actorId, "@Me", type)]; break;
			case "game": owners = await getGames(sageCommand); break;
			case "server": owners = [new MacroOwner(sageCommand.server.did, sageCommand.server.name, type)]; break;
			case "global": owners = [new MacroOwner(sageCommand.bot.did, "RPG Sage", type)]; break;
			default: owners = []; break;
		}
		owners.sort((a, b) => sortPrimitive(a.name, b.name));
		return owners;
	}

	public static getLabel(type: MacroOwnerTypeKey): MacroOwnerLabels {
		return MacroOwner.getLabels().find(owner => owner.type === type)!;
	}

	public static getLabels(): MacroOwnerLabels[] {
		const types: MacroOwnerTypeKey[] = ["character", "user", "game", "server", "global"];
		return types.map(type => {
			const singularKey = type.toUpperCase() as SingularKey;
			const pluralKey = singularKey === "GLOBAL" ? singularKey : `${singularKey}S` as PluralKey;
			return { type, typeKey:`${singularKey}_MACROS`, pluralKey, singularKey };
		});
	}
}
