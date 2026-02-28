import { isNotBlank, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { assertArray, assertBoolean, assertNumber, assertSageCore, assertString, ensureArray, ensureIds, ensureTypedArray, isAlias, isMacroBase, isNote, optional, renameProperty, type EnsureContext } from "../validation/index.js";
import type { Alias, MacroBase, Note, SageCharacterCoreV0, SageCharacterCoreV1, SageCore } from "./index.js";
import { assertSageCharacterCoreV1, DialogDiceBehaviorType, DialogPostType, ensureSageCharacterCore, MoveDirectionOutputType } from "./index.js";

export type SageUserCoreAny = SageUserCore | SageUserCoreOld;

export type SageUserCoreOld = SageUserCore & {
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

export type SageUserCore = SageCore<"User", Snowflake | UUID> & {

	/** @deprecated use dialog templates */
	aliases?: Alias[];

	/** "on" (true) by default */
	confirmationPrompts?: boolean;

	/** "Embed" by default */
	defaultDialogType?: DialogPostType;

	/** "Embed" by default */
	defaultSagePostType?: DialogPostType;

	/** "Default": [] for dice and [[]] for inline dice; reversed for "Inline" */
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

	/** "@" by default */
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

export const SageUserV1Keys: (keyof SageUserCore)[] = [
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
];

const objectType = "User";
export function assertSageUserCore(core: SageUserCoreAny): core is SageUserCore {
	if (!assertSageCore<SageUserCore>(core, objectType, SageUserV1Keys)) return false;

	if (!assertArray({ core, objectType, key:"aliases", optional, validator:isAlias })) return false;
	if (!assertBoolean({ core, objectType, key:"confirmationPrompts", optional })) return false;
	if (!assertNumber({ core, objectType, key:"defaultDialogType", optional, validator:DialogPostType })) return false;
	if (!assertNumber({ core, objectType, key:"defaultSagePostType", optional, validator:DialogPostType })) return false;
	if (!assertNumber({ core, objectType, key:"dialogDiceBehaviorType", optional, validator:DialogDiceBehaviorType })) return false;
	// did
	if (!assertBoolean({ core, objectType, key:"dmOnDelete", optional })) return false;
	if (!assertBoolean({ core, objectType, key:"dmOnEdit", optional })) return false;
	if (!assertString({ core, objectType, key:"forceConfirmationFlag", optional, validator:isNotBlank })) return false;
	// id
	if (!assertArray({ core, objectType, key:"macros", optional, validator:isMacroBase })) return false;
	if (!assertString({ core, objectType, key:"mentionPrefix", optional, validator:isNotBlank })) return false;
	if (!assertNumber({ core, objectType, key:"moveDirectionOutputType", optional, validator:MoveDirectionOutputType })) return false;
	if (!assertArray({ core, objectType, key:"notes", optional, validator:isNote })) return false;
	// objectType
	if (!assertArray({ core, objectType, key:"playerCharacters", optional, validator:assertSageCharacterCoreV1 })) return false;
	if (!assertString({ core, objectType, key:"skipConfirmationFlag", optional, validator:isNotBlank })) return false;
	// uuid

	return true;
}

export function ensureSageUserCore(core: SageUserCoreOld, context?: EnsureContext): SageUserCore {

	ensureIds(core);

	ensureTypedArray({ core, key:"aliases", typeGuard:isAlias, optional });
	renameProperty({ core, oldKey:"characters", newKey:"playerCharacters" });
	ensureTypedArray({ core, key:"macros", typeGuard:isMacroBase, optional });
	delete core.nonPlayerCharacters;
	ensureTypedArray({ core, key:"notes", typeGuard:isNote, optional });
	ensureArray({ core, key:"playerCharacters", handler:ensureSageCharacterCore, optional, context:{ ...context, userId:core.id as Snowflake } });
	delete core.patronTier;

	return core;
}

// export type UserDataV2 = {
// 	characters?: SageCharacterV2[];
// 	macros?: MacroBase[];
// 	notes?: Note[];
// };

// export const UserDataV2Keys: (keyof UserDataV2)[] = [
// 	"characters",
// 	"macros",
// 	"notes",
// ];

// export type UserSettingsV2 = {
// 	confirmationPrompts?: boolean;
// 	defaultDialogType?: DialogPostType;
// 	defaultSagePostType?: DialogPostType;
// 	dialogDiceBehaviorType?: DialogDiceBehaviorType;
// 	dmOnDelete?: boolean;
// 	dmOnEdit?: boolean;
// 	forceConfirmationFlag?: string;
// 	mentionPrefix?: string;
// 	moveDirectionOutputType?: MoveDirectionOutputType;
// 	skipConfirmationFlag?: string;
// };

// export const UserSettingsV2Keys: (keyof UserSettingsV2)[] = [
// 	"confirmationPrompts",
// 	"defaultDialogType",
// 	"defaultSagePostType",
// 	"dialogDiceBehaviorType",
// 	"dmOnDelete",
// 	"dmOnEdit",
// 	"forceConfirmationFlag",
// 	"mentionPrefix",
// 	"moveDirectionOutputType",
// 	"skipConfirmationFlag",
// ];

// export type UserV2 = SageCore<"User", Snowflake> & {
// 	settings: UserSettingsV2;
// 	updatedTs: number;
// 	ver: number;
// };

// export const UserV2Keys: (keyof UserV2)[] = [
// 	"did",
// 	"id",
// 	"objectType",
// 	"settings",
// 	"updatedTs",
// 	"uuid",
// 	"ver"
// ];
