import type { Snowflake, UUID } from "@rsc-utils/core-utils";
import type { HasEmbedColors, HasEmoji } from "../../enums/index.js";
import type { GameOptions, PostCurrency, SageChannel } from "../../index.js";
import type { MacroBase, SageCore } from "../../other/index.js";
import type { SageCharacterCore } from "../../SageCharacter/index.js";
import { GameOptionsKeys } from "../../GameOptions.js";

export type HasPostCurrency = { postCurrency?:PostCurrency; };

export enum GameRoleType { Unknown = 0, Spectator = 1, Player = 2, GameMaster = 3, Cast = 4, Table = 5 }
export type GameRoleData = { did: Snowflake; type: GameRoleType; dicePing: boolean; };

export enum GameUserType { Unknown = 0, Player = 1, GameMaster = 2 }
export type GameUserData = { did: Snowflake; type: GameUserType; dicePing: boolean; };

export type SageGameCoreV1 = SageCore<"Game", Snowflake | UUID> & HasEmbedColors & HasEmoji & GameOptions & HasPostCurrency & {

	/** timestamp the game was archived */
	archivedTs?: number;

	/** discord channels and their options */
	channels: SageChannel[];

	/** timestamp the game was created */
	createdTs: number;

	encounters?: unknown[];

	/** game level gm character */
	gmCharacter?: SageCharacterCore;

	// id

	/** game level macros */
	macros?: MacroBase[];

	/** the "@" alternative for using "@Players" */
	mentionPrefix?: string;

	/** the name of the game */
	name: string;

	/** list of non player characters */
	nonPlayerCharacters?: SageCharacterCore[];

	// objectType

	parties?: unknown[];

	/** list of player characters */
	playerCharacters?: SageCharacterCore[];

	/** used to allow users in the game via role instead of .users */
	roles?: GameRoleData[];

	/** game server's sage uuid */
	serverId: UUID;

	/** game server's discord snowflake */
	serverDid: Snowflake;

	/** users and gms */
	users?: GameUserData[];

	// uuid

	// ver
};

export const SageGameV1Keys: (keyof SageGameCoreV1)[] = [
	...GameOptionsKeys,
	"archivedTs",
	"channels",
	"colors",
	"createdTs",
	"did",
	"emoji",
	// "encounters",
	"gmCharacter",
	"id",
	"macros",
	"mentionPrefix",
	"name",
	"nonPlayerCharacters",
	"objectType",
	// "parties",
	"playerCharacters",
	"postCurrency",
	"roles",
	"serverDid",
	"serverId",
	"users",
	"uuid",
];
/*
	createdTs: number;
	archivedTs?: number;

	name: string;

	serverId: UUID;
	serverDid: Snowflake;

	channels: SageChannel[];
	roles?: GameRoleData[];

	users?: GameUserData[];

	gmCharacter?: GameCharacter | GameCharacterCore;
	nonPlayerCharacters?: (GameCharacter | GameCharacterCore)[];
	playerCharacters?: (GameCharacter | GameCharacterCore)[];

	parties?: PartyCore[] | PartyManager;
	encounters?: EncounterCore[] | EncounterManager;

	macros?: MacroBase[];

	mentionPrefix?: string;
*/