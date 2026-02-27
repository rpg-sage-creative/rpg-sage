import type { Snowflake, UUID } from "@rsc-utils/core-utils";
import type { AdminRole, AdminUser, GameCreatorType, HasEmbedColors, HasEmoji } from "../../enums/index.js";
import type { MacroBase, SageChannel, SageCore, ServerOptions } from "../../index.js";
import type { SageCharacterCoreV1 } from "../../SageCharacter/index.js";
import { ServerOptionsKeys } from "../../ServerOptions.js";

export type SageServerCoreV1 = SageCore<"Server", Snowflake | UUID> & HasEmbedColors & HasEmoji & ServerOptions & {

	/** explicit list of users to admin sage/games */
	admins: AdminUser[];

	/** all non-game channel configurations */
	channels: SageChannel[];

	/** "sage!" by default */
	commandPrefix?: string;

	// did

	/** "Admin" by default */
	gameCreatorType?: GameCreatorType;

	/** this is/was intended to reference a server wide game */
	gameId?: string;

	/** server level gm character for shared stats/npcs and non-game usage */
	gmCharacter?: SageCharacterCoreV1;

	// id

	/** server level macros */
	macros?: MacroBase[];

	/** stores the name of the server the last time an update was made */
	name: string;

	// objectType

	/** used to allow users to admin sage/games via role instead of .admins */
	roles: AdminRole[];

	// uuid

	// ver

};

export const SageServerV1Keys: (keyof SageServerCoreV1)[] = [
	...ServerOptionsKeys,
	"admins",
	"channels",
	"colors",
	"commandPrefix",
	"did",
	"emoji",
	"gameCreatorType",
	// "gameId",
	"gmCharacter",
	"id",
	"macros",
	"name",
	"objectType",
	"roles",
	"uuid",
];

/*
export type ServerOptions = DialogOptions & DiceOptions & GameSystemOptions;

export type DialogOptions = {
	dialogPostType: DialogPostType;
	gmCharacterName: string;
	mentionPrefix?: string;
	moveDirectionOutputType?: number;
	sendDialogTo: Snowflake;
};

export type DiceOptions = {
	diceCritMethodType: DiceCriticalMethodType;
	diceOutputType: DiceOutputType;
	dicePostType: DicePostType;
	diceSecretMethodType: DiceSecretMethodType;
	diceSortType: DiceSortType;
	sendDiceTo: Snowflake;
};

export type GameSystemOptions = {
	gameSystemType: GameSystemType;
};
*/