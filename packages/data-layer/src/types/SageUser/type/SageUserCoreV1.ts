import type { Snowflake, UUID } from "@rsc-utils/core-utils";
import type { Alias, DialogDiceBehaviorType, DialogPostType, MacroBase, MoveDirectionOutputType, Note, SageCharacterCoreV1, SageCore } from "../../index.js";

export type SageUserCoreV1 = SageCore<"User", Snowflake | UUID> & {
	/** @deprecated use dialog templates */
	aliases?: Alias[];
	confirmationPrompts?: boolean;
	defaultDialogType?: DialogPostType;
	defaultSagePostType?: DialogPostType;
	dialogDiceBehaviorType?: DialogDiceBehaviorType;
	// did
	dmOnDelete?: boolean;
	dmOnEdit?: boolean;
	forceConfirmationFlag?: string;
	// id
	macros?: MacroBase[];
	mentionPrefix?: string;
	moveDirectionOutputType?: MoveDirectionOutputType;
	notes?: Note[];
	// objectType
	/** @deprecated use single .characters array */
	playerCharacters?: SageCharacterCoreV1[];
	skipConfirmationFlag?: string;
	// uuid
	// ver
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
