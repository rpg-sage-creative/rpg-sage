import type { IdCore } from "@rsc-utils/core-utils";
import type { Alias, DialogDiceBehaviorType, DialogPostType, MacroBase, MoveDirectionOutputType, Note, SageCharacterCoreV0 } from "../../index.js";

export type SageUserCoreV0 = IdCore<"User"> & {
	aliases?: Alias[];
	/** @deprecated moved to playerCharacters */
	characters?: SageCharacterCoreV0[];
	confirmationPrompts?: boolean;
	defaultDialogType?: DialogPostType;
	defaultSagePostType?: DialogPostType;
	dialogDiceBehaviorType?: DialogDiceBehaviorType;
	dmOnDelete?: boolean;
	dmOnEdit?: boolean;
	forceConfirmationFlag?: string;
	macros?: MacroBase[];
	mentionPrefix?: string;
	moveDirectionOutputType?: MoveDirectionOutputType;
	/** @deprecated never implemented */
	nonPlayerCharacters?: SageCharacterCoreV0[];
	notes?: Note[];
	playerCharacters?: SageCharacterCoreV0[];
	/** @deprecated via roles */
	patronTier?: number;
	skipConfirmationFlag?: string;
	ver: number;
};