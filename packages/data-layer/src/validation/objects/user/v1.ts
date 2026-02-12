import { isNotBlank, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { assertArray, assertBoolean, assertNumber, assertSageCore, assertString, optional } from "../../assertions/index.js";
import { ensureArray } from "../../ensures/ensureArray.js";
import { deleteEmptyArray } from "../../types/deleteEmptyArray.js";
import { DialogDiceBehaviorType, DialogPostType, isAlias, isMacroBase, isNote, MoveDirectionOutputType, type Alias, type MacroBase, type Note, type SageCore } from "../../types/index.js";
import { renameProperty } from "../../types/renameProperty.js";
import { assertSageCharacterCoreV1, type SageCharacterCoreV1 } from "../character/v1.js";
import type { SageUserV0 } from "./v0.js";

export type SageUserV1 = SageCore<"User", Snowflake | UUID> & {
	/** @deprecated use dialog macros */
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

export const SageUserV1Keys: (keyof SageUserV1)[] = [
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

const objectType = "User";
export function assertSageUserV1(core: unknown): core is SageUserV1 {
	if (!assertSageCore<SageUserV1>(core, objectType, SageUserV1Keys)) return false;

	if (!assertArray({ core, objectType, key:"aliases", optional, validator:isAlias })) return false;
	if (!assertBoolean({ core, objectType, key:"confirmationPrompts", optional })) return false;
	if (!assertNumber({ core, objectType, key:"defaultDialogType", optional, validator:DialogPostType })) return false;
	if (!assertNumber({ core, objectType, key:"defaultSagePostType", optional, validator:DialogPostType })) return false;
	if (!assertNumber({ core, objectType, key:"dialogDiceBehaviorType", optional, validator:DialogDiceBehaviorType })) return false;
	// did
	if (!assertBoolean({ core, objectType, key:"dmOnDelete", optional })) return false;
	if (!assertBoolean({ core, objectType, key:"dmOnEdit", optional })) return false;
	if (!assertString({ core, objectType, key:"forceConfirmationFlag", validator:isNotBlank, optional })) return false;
	// id
	if (!assertArray({ core, objectType, key:"macros", optional, validator:isMacroBase })) return false;
	if (!assertString({ core, objectType, key:"mentionPrefix", validator:isNotBlank, optional })) return false;
	if (!assertNumber({ core, objectType, key:"moveDirectionOutputType", optional, validator:MoveDirectionOutputType })) return false;
	if (!assertArray({ core, objectType, key:"notes", optional, validator:isNote })) return false;
	// objectType
	if (!assertArray({ core, objectType, key:"playerCharacters", optional, validator:assertSageCharacterCoreV1 })) return false;
	if (!assertString({ core, objectType, key:"skipConfirmationFlag", validator:isNotBlank, optional })) return false;
	// uuid
	// ver
	return true;
}

export function ensureUserV1(core: SageUserV0): SageUserV1 {
	if (core.ver > 0) throw new Error(`cannot convert v${core.ver} to v1`);
	deleteEmptyArray({ core, key:"aliases" });
	renameProperty({ core, oldKey:"characters", newKey:"playerCharacters" })
	deleteEmptyArray({ core, key:"macros" });
	deleteEmptyArray({ core, key:"nonPlayerCharacters" });
	deleteEmptyArray({ core, key:"notes" });
	// core.playerCharacters = core.playerCharacters?.map(char => (char.ver > 0 ? char : characterV1FromV0(char)) ?? [];
	ensureArray;//({ core, key:"playerCharacters", handler:characterV1FromV0, ver:1 });
	deleteEmptyArray({ core, key:"playerCharacters" });
	delete core.patronTier;
	core.ver = 1;
	return core as SageUserV1;
}