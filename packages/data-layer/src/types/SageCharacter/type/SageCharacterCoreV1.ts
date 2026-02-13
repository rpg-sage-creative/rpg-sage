import type { HexColorString, Snowflake } from "@rsc-utils/core-utils";
import type { AutoChannelData, DeckCoreV1, MacroBase, Note, SageCore, SageMessageReferenceCoreV1 } from "../../index.js";

export type SageCharacterCoreV1 = Omit<SageCore<"Character", Snowflake>, "did"> & {
	aka?: string;
	alias?: string;
	autoChannels?: AutoChannelData[];
	avatarUrl?: string;
	companions?: SageCharacterCoreV1[];
	decks?: DeckCoreV1[];
	embedColor?: HexColorString;
	essence20?: unknown;
	essence20Id?: string;
	hephaistos?: unknown;
	hephaistosId?: string;
	lastMessages?: SageMessageReferenceCoreV1[];
	macros?: MacroBase[];
	name: string;
	notes?: Note[];
	pathbuilder?: unknown;
	pathbuilderId?: string;
	tokenUrl?: string;
	userDid?: Snowflake;
	ver: number;
};

export const SageCharacterCoreV1Keys: (keyof SageCharacterCoreV1)[] = [
	"aka",
	"alias",
	"autoChannels",
	"avatarUrl",
	"companions",
	"decks",
	"embedColor",
	"essence20",
	"essence20Id",
	"hephaistos",
	"hephaistosId",
	"id",
	"lastMessages",
	"macros",
	"name",
	"notes",
	"objectType",
	"pathbuilder",
	"pathbuilderId",
	"tokenUrl",
	"userDid",
	"uuid",
	"ver",
];