import { isNotBlank, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { assertArray, assertBoolean, assertNumber, assertSageCore, assertString, ensureArray, ensureIds, isMacroBase, optional, renameProperty, type EnsureContext } from "../validation/index.js";
import { DialogDiceBehaviorType, DialogPostType, MoveDirectionOutputType } from "./enums/index.js";
import { isAlias, type Alias } from "./other/Alias.js";
import type { MacroBase, SageCore } from "./other/index.js";
import { isNote, type Note } from "./other/Note.js";
import { assertSageCharacterCore, ensureSageCharacterCore, type SageCharacterCore, type SageCharacterCoreOld } from "./SageCharacterCore.js";

export type SageUserCoreAny = SageUserCore | SageUserCoreOld;

export type SageUserCoreOld = Omit<SageUserCore, "characters" | "nonPlayerCharacters" | "playerCharacters"> & {
	/** @deprecated moved to playerCharacters */
	characters?: SageCharacterCoreOld[];
	/** @deprecated never implemented */
	nonPlayerCharacters?: SageCharacterCoreOld[];
	playerCharacters?: SageCharacterCoreOld[];
	/** @deprecated via roles */
	patronTier?: number;
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
	playerCharacters?: SageCharacterCore[];

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
	if (!assertArray({ core, objectType, key:"playerCharacters", optional, validator:assertSageCharacterCore })) return false;
	if (!assertString({ core, objectType, key:"skipConfirmationFlag", optional, validator:isNotBlank })) return false;
	// uuid

	return true;
}

export function ensureSageUserCore(core: SageUserCoreOld, context?: EnsureContext): SageUserCore {

	ensureIds(core);

	ensureArray({ core, key:"aliases", optional, typeGuard:isAlias });
	renameProperty({ core, oldKey:"characters", newKey:"playerCharacters" });
	ensureArray({ core, key:"macros", optional, typeGuard:isMacroBase });
	delete core.nonPlayerCharacters;
	ensureArray({ core, key:"notes", optional, typeGuard:isNote });
	ensureArray({ core, key:"playerCharacters", handler:ensureSageCharacterCore, optional, context:{ ...context, userId:core.id as Snowflake } });
	delete core.patronTier;

	return core as SageUserCore;
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
