import { isNonNilSnowflake, isNonNilUuid, isValidId, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { assertArray, assertNumber, assertObject, assertSageCore, assertString, deleteEmptyArray, ensureArray, ensureIds, isMacroBase, optional, renameProperty, type EnsureContext } from "../validation/index.js";
import { isEmbedColor, type HasEmbedColors } from "./enums/EmbedColorType.js";
import { isEmoji, type HasEmoji } from "./enums/EmojiType.js";
import { isGameRoleData, type GameRoleData } from "./enums/GameRoleType.js";
import { GameUserType, isGameUserData, type GameUserData } from "./enums/GameUserType.js";
import { assertGameOptions, ensureGameOptions, GameOptionsKeys, type GameOptions, type GameOptionsOld } from "./GameOptions.js";
import { type MacroBase, type SageCore } from "./other/index.js";
import { assertPostCurrency, type HasPostCurrency } from "./PostCurrency.js";
import { assertSageChannel, ensureSageChannel, type SageChannel, type SageChannelOld } from "./SageChannel.js";
import { assertSageCharacterCore, ensureSageCharacterCore, type SageCharacterCore, type SageCharacterCoreOld } from "./SageCharacterCore.js";

export type SageGameCoreAny = SageGameCore | SageGameCoreOld;

export type SageGameCoreOld = Omit<SageGameCore, "channels" | "gmCharacter" | "nonPlayesCharacters" | "playerCharacters"> & GameOptionsOld & {
	channels: SageChannelOld[];
	/** @deprecated */
	gameMasters?: { did:Snowflake; }[];
	gmCharacter?: SageCharacterCoreOld;
	/** @deprecated */
	nonPlayerCharacters?: SageCharacterCoreOld[];
	/** @deprecated */
	playerCharacters?: SageCharacterCoreOld[];
	/** @deprecated */
	players?: { did:Snowflake; }[];
	/** @deprecated */
	type?: number;
}

export type SageGameCore = Omit<SageCore<"Game", Snowflake | UUID>, "createdTs"> & HasEmbedColors & HasEmoji & GameOptions & HasPostCurrency & {

	/** timestamp the game was archived */
	archivedTs?: number;

	/** discord channels and their options */
	channels: SageChannel[];

	/** timestamp the game was created */
	createdTs: number;

	// did (SageCore)

	encounters?: unknown[];

	/** game level gm character */
	gmCharacter?: SageCharacterCore;

	// id (SageCore)

	/** game level macros */
	macros?: MacroBase[];

	/** the "@" alternative for using "@Players" */
	mentionPrefix?: string;

	/** the name of the game */
	name: string;

	/** list of non player characters */
	nonPlayerCharacters?: SageCharacterCore[];

	// objectType (SageCore)

	parties?: unknown[];

	/** list of player characters */
	playerCharacters?: SageCharacterCore[];

	/** used to allow users in the game via role instead of .users */
	roles?: GameRoleData[];

	/** game server's sage uuid */
	serverId: Snowflake | UUID;

	/** game server's discord snowflake */
	serverDid: Snowflake;

	// updatedTs (SageCore)

	/** users and gms */
	users?: GameUserData[];

	// uuid (SageCore)
};

export const SageGameKeys: (keyof SageGameCore)[] = [
	...GameOptionsKeys,
	"archivedTs",
	"channels",
	"colors",
	"createdTs",
	"did",
	"emoji",
	"encounters",
	"gmCharacter",
	"id",
	"macros",
	"mentionPrefix",
	"name",
	"nonPlayerCharacters",
	"objectType",
	"parties",
	"playerCharacters",
	"postCurrency",
	"roles",
	"serverDid",
	"serverId",
	"updatedTs",
	"users",
	"uuid",
];

const objectType = "Game";
export function assertSageGameCore(core: unknown): core is SageGameCore {
	if (!assertSageCore<SageGameCore>(core, objectType, SageGameKeys)) return false;

	if (!assertGameOptions({ core, objectType })) return false;

	if (!assertNumber({ core, objectType, key:"archivedTs", optional })) return false;
	if (!assertArray({ core, objectType, key:"channels", optional, asserter:assertSageChannel })) return false;
	if (!assertArray({ core, objectType, key:"colors", optional, validator:isEmbedColor })) return false;
	if (!assertNumber({ core, objectType, key:"createdTs" })) return false;
	// did --> this needs to become an invalid key
	if (!assertArray({ core, objectType, key:"emoji", optional, validator:isEmoji })) return false;
	// core.encounters --> not currently in use
	if (!assertObject({ core, objectType, key:"gmCharacter", optional, validator:assertSageCharacterCore })) return false;
	// id
	if (!assertArray({ core, objectType, key:"macros", optional, validator:isMacroBase })) return false;
	if (!assertArray({ core, objectType, key:"nonPlayerCharacters", optional, validator:assertSageCharacterCore })) return false;
	// objectType
	// core.parties --> not currently in use
	if (!assertArray({ core, objectType, key:"playerCharacters", optional, validator:assertSageCharacterCore })) return false;
	if (!assertObject({ core, objectType, key:"postCurrency", optional, asserter:assertPostCurrency })) return false;
	if (!assertArray({ core, objectType, key:"roles", optional, validator:isGameRoleData })) return false;
	if (!assertString({ core, objectType, key:"serverDid", validator:isNonNilSnowflake })) return false;
	if (!assertString({ core, objectType, key:"serverId", validator:val => isNonNilSnowflake(val) || isNonNilUuid(val) })) return false;
	if (!assertArray({ core, objectType, key:"users", optional, uniqueByKey:"did", validator:isGameUserData })) return false;
	// uuid --> this needs to become an invalid key

	return true;
}

export function ensureSageGameCore(core: SageGameCoreOld, context?: EnsureContext): SageGameCore {
	ensureIds(core, { didTs:core.createdTs });

	ensureGameOptions(core);
	renameProperty({ core, oldKey:"type", newKey:"gameSystemType" });

	ensureArray({ core, key:"channels", optional, handler:ensureSageChannel , context:{ ...context, gameId:core.id as Snowflake }});
	ensureArray({ core, key:"emoji", optional, typeGuard:isEmoji });
	deleteEmptyArray({ core, key:"encounters" });
	deleteEmptyArray({ core, key:"parties" });
	if (!isValidId(core.serverId)) core.serverId = core.serverDid;

	//#region core.users
	// move old old gameMasters list to users list
	if ("gameMasters" in core && core.gameMasters?.length) {
		const users = core.users ??= [];
		core.gameMasters.forEach(({ did }) => users.some(u => u.did === did) ? void 0 : users.push({ did, type:GameUserType.GameMaster, dicePing:true }));
		delete core.gameMasters;
	}
	// move old old players list to users list
	if ("players" in core && core.players?.length) {
		const users = core.users ??= [];
		core.players.forEach(({ did }) => users.some(u => u.did === did) ? void 0 : users.push({ did, type:GameUserType.Player, dicePing:true }));
		delete core.players;
	}
	// remove duplicate users
	core.users = fixDupeUsers(core.users);
	// remove any invalid users
	ensureArray({ core, key:"users", typeGuard:isGameUserData });
	//#endregion

	const gameId = core.id as Snowflake;
	core.gmCharacter ? core.gmCharacter = ensureSageCharacterCore(core.gmCharacter, { ...context, characterType:"gm", gameId }) as SageCharacterCoreOld : delete core.gmCharacter;
	ensureArray({ core, key:"nonPlayerCharacters", optional, handler:ensureSageCharacterCore, context:{ ...context, gameId } });
	ensureArray({ core, key:"playerCharacters", optional, handler:ensureSageCharacterCore, context:{ ...context, gameId } });

	return core;
}

/** Cleans up the users from the time we weren't correctly validating duplicate users when adding them. */
function fixDupeUsers(users?: GameUserData[]): GameUserData[] | undefined {
	if (!users) return undefined;

	// 0 = unkonwn, 1 = player, 2 = gm
	const sets = [new Set<string>(), new Set<string>(), new Set<string>()];

	users.forEach(user => sets[user.type ?? 0].add(user.did));

	const filtered: GameUserData[] = [];
	while (sets.length) {
		// do them in priority order: gm, player, other
		const set = sets.pop()!;
		// we just popped the set, so length is the user type
		const type = sets.length;
		for (const did of set) {
			const found = users.find(user => user.did === did && user.type === type);
			if (found && !filtered.find(user => user.did === did)) {
				filtered.push(found);
			}
		}
	}
	return filtered;
}