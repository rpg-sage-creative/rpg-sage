import { isNotBlank } from "@rsc-utils/core-utils";
import { assertArray, assertBoolean, assertNumber, assertSageCore, assertString, isAlias, isMacroBase, isNote, optional } from "../../../validation/index.js";
import { assertSageCharacterCoreV1, DialogDiceBehaviorType, DialogPostType, MoveDirectionOutputType } from "../../index.js";
import { SageUserV1Keys, type SageUserCoreAny, type SageUserCoreV1 } from "../index.js";

const objectType = "User";
export function assertSageUserCoreV1(core: SageUserCoreAny): core is SageUserCoreV1 {
	if (!assertSageCore<SageUserCoreV1>(core, objectType, SageUserV1Keys)) return false;

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
