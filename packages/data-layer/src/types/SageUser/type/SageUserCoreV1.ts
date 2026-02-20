import type { Snowflake, UUID } from "@rsc-utils/core-utils";
import type { Alias, DialogDiceBehaviorType, DialogPostType, MacroBase, MoveDirectionOutputType, Note, SageCharacterCoreV1, SageCore } from "../../index.js";

export type SageUserCoreV1 = SageCore<"User", Snowflake | UUID> & {

	/** @deprecated use dialog templates */
	aliases?: Alias[];

	/** "on" (true) by default */
	confirmationPrompts?: boolean;

	defaultDialogType?: DialogPostType;

	defaultSagePostType?: DialogPostType;

	dialogDiceBehaviorType?: DialogDiceBehaviorType;

	// did (SageCore)

	/** "off" (false) by default */
	dmOnDelete?: boolean;

	/** "on" (true) by default */
	dmOnEdit?: boolean;

	/** "-p" by default */
	forceConfirmationFlag?: string;

	// id (SageCore)

	macros?: MacroBase[];

	mentionPrefix?: string;

	moveDirectionOutputType?: MoveDirectionOutputType;

	notes?: Note[];

	// objectType (SageCore)

	/** @deprecated use single .characters array */
	playerCharacters?: SageCharacterCoreV1[];

	/** "-y" by default */
	skipConfirmationFlag?: string;

	// uuid (SageCore)

	// ver (SageCore)
};

export const SageUserV1Keys: (keyof SageUserCoreV1)[] = [
	"aliases",
	"confirmationPrompts",
	"defaultDialogType",
	"defaultSagePostType",
	"dialogDiceBehaviorType",
	"did",
	"dmOnDelete",
	"dmOnEdit",
	"forceConfirmationFlag",
	"id",
	"macros",
	"mentionPrefix",
	"moveDirectionOutputType",
	"notes",
	"objectType",
	"playerCharacters",
	"skipConfirmationFlag",
	"uuid",
	"ver"
];
