import type { Snowflake, UUID } from "@rsc-utils/core-utils";
import type { SageCore } from "../../other/SageCore.js";
import type { HasEmbedColors } from "../../enums/EmbedColorType.js";
import type { HasEmoji } from "../../enums/EmojiType.js";
import type { MacroBase } from "../../other/MacroBase.js";
import type { SageCharacterCoreV1 } from "../../SageCharacter/index.js";
import type { SageChannel } from "../../SageChannel/SageChannel.js";
import type { ServerOptions } from "../../options/ServerOptions.js";
// import type { SageChannel } from "../../SageChannel/index.js";

export enum AdminRoleType { Unknown = 0, GameAdmin = 1, ServerAdmin = 2, SageAdmin = 3 }
export type IAdminRole = { did: Snowflake; type: AdminRoleType; }
export type IAdminUser = { did: Snowflake; role: AdminRoleType; }
export enum GameCreatorType { Admin = 0, Any = 1, None = 2 }

export type SageServerCoreV1 = SageCore<"Server", Snowflake | UUID> & HasEmbedColors & HasEmoji & Partial<ServerOptions> & {

	/** explicit list of users to admin sage/games */
	admins: IAdminUser[];

	/** all non-game channel configurations */
	channels: SageChannel[];

	// colors?

	/** "sage!" by default */
	commandPrefix?: string;

	// dialogPostType?: DialogPostType;

	// diceCritMethodType?: DiceCriticalMethodType;

	// diceOutputType?: DiceOutputType;

	// dicePostType?: DicePostType;

	// diceSecretMethodType?: DiceSecretMethodType;

	// diceSortType?: DiceSortType;

	// did

	// emoji?

	/** "Admin" by default */
	gameCreatorType?: GameCreatorType;

	/** this is/was intended to reference a server wide game */
	gameId?: string;

	// gameSystemType: GameSystemType;

	/** server level gm character for shared stats/npcs and non-game usage */
	gmCharacter?: SageCharacterCoreV1;

	// gmCharacterName?: string;

	// id

	/** server level macros */
	macros?: MacroBase[];

	// mentionPrefix?: string;

	// moveDirectionOutputType?: number;

	/** stores the name of the server the last time an update was made */
	name: string;

	// objectType

	/** used to allow users to admin sage/games via role instead of .admins */
	roles: IAdminRole[];

	// sendDialogTo?: Snowflake;

	// sendDiceTo?: Snowflake;

	// uuid

	// ver

};

export const SageServerV1Keys: (keyof SageServerCoreV1)[] = [
	"admins",
	"channels",
	"colors",
	"commandPrefix",
	"dialogPostType",
	"diceCritMethodType",
	"diceOutputType",
	"dicePostType",
	"diceSecretMethodType",
	"diceSortType",
	"did",
	"emoji",
	"gameCreatorType",
	"gameId",
	"gameSystemType",
	"gmCharacter",
	"gmCharacterName",
	"id",
	"macros",
	"mentionPrefix",
	"moveDirectionOutputType",
	"name",
	"objectType",
	"roles",
	"sendDialogTo",
	"sendDiceTo",
	"uuid",
	"ver"
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