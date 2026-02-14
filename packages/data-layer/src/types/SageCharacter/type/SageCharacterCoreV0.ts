import type { HexColorString, Snowflake } from "@rsc-utils/core-utils";
import type { AutoChannelData, DeckCoreV1, MacroBase, Note, SageCore, SageMessageReferenceCoreV0 } from "../../index.js";

export type SageCharacterCoreV0 = Omit<SageCore<"Character", Snowflake>, "did"> & {
	/** @deprecated */
	aka?: string;
	alias?: string;
	autoChannels?: AutoChannelData[];
	avatarUrl?: string;
	companions?: SageCharacterCoreV0[];
	decks?: DeckCoreV1[];
	embedColor?: HexColorString;
	essence20?: unknown;
	essence20Id?: string;
	hephaistos?: unknown;
	hephaistosId?: string;
	/** @deprecated */
	iconUrl?: string;
	lastMessages?: SageMessageReferenceCoreV0[];
	macros?: MacroBase[];
	name: string;
	notes?: Note[];
	pathbuilder?: unknown;
	pathbuilderId?: string;
	tokenUrl?: string;
	userDid?: Snowflake;
	ver: number;
};
