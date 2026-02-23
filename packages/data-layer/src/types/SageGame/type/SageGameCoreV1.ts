import type { Snowflake, UUID } from "@rsc-utils/core-utils";
import type { SageCore } from "../../other/SageCore.js";
import type { HasEmbedColors } from "../../enums/EmbedColorType.js";
import type { HasEmoji } from "../../enums/EmojiType.js";
import type { GameOptions } from "../../options/GameOptions.js";
import type { SageChannel } from "../../SageChannel/SageChannel.js";
import type { SageCharacterCore } from "../../SageCharacter/index.js";
import type { MacroBase } from "../../other/MacroBase.js";

export type HasPostCurrency = { postCurrency?:Record<string, unknown>; };

export enum GameRoleType { Unknown = 0, Spectator = 1, Player = 2, GameMaster = 3, Cast = 4, Table = 5 }
export type GameRoleData = { did: Snowflake; type: GameRoleType; dicePing: boolean; };

export enum GameUserType { Unknown = 0, Player = 1, GameMaster = 2 }
export type GameUserData = { did: Snowflake; type: GameUserType; dicePing: boolean; };

export type SageGameCoreV1 = SageCore<"User", Snowflake | UUID>
	& HasEmbedColors & HasEmoji & Partial<GameOptions> & HasPostCurrency & {
	createdTs: number;
	archivedTs?: number;

	name: string;

	serverId: UUID;
	serverDid: Snowflake;

	channels: SageChannel[];
	roles?: GameRoleData[];

	users?: GameUserData[];

	gmCharacter?: SageCharacterCore;
	nonPlayerCharacters?: SageCharacterCore[];
	playerCharacters?: SageCharacterCore[];

	parties?: unknown[];
	encounters?: unknown[];

	macros?: MacroBase[];

	mentionPrefix?: string;
};

export const SageGameV1Keys: (keyof SageGameCoreV1)[] = [
	"archivedTs",
	"channels",
	"colors",
	"createdTs",
	"dialogPostType",
	"diceCritMethodType",
	"diceOutputType",
	"dicePostType",
	"diceSecretMethodType",
	"diceSortType",
	"did",
	"emoji",
	"encounters",
	"gameSystemType",
	"gmCharacter",
	"gmCharacterName",
	"id",
	"macros",
	"mentionPrefix",
	"moveDirectionOutputType",
	"name",
	"nonPlayerCharacters",
	"objectType",
	"parties",
	"playerCharacters",
	"postCurrency",
	"roles",
	"sendDialogTo",
	"sendDiceTo",
	"serverDid",
	"serverId",
	"users",
	"uuid",
	"ver"
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