import { isNotBlank } from "@rsc-utils/core-utils";
import { assertDialogOptionsV1, assertDiceOptionsV1, assertGameSystemOptionsV1, assertSageChannelV1, assertSageCharacterCoreV1, isEmbedColor, isEmoji, type SageChannelAny } from "../../../index.js";
import { assertArray, assertNumber, assertSageCore,assertString,isMacroBase,optional } from "../../../validation/index.js";
import { SageGameV1Keys, type SageGameCoreAny, type SageGameCoreV1 } from "../index.js";

const objectType = "Game";
export function assertSageGameCoreV1(core: SageGameCoreAny): core is SageGameCoreV1 {
	if (!assertSageCore<SageGameCoreV1>(core, objectType, SageGameV1Keys)) return false;

	if (!assertNumber({ core, objectType, key:"archivedTs", optional })) return false;
	if (!assertArray({ core, objectType, key:"channels", optional, validator:(channel: SageChannelAny) => assertSageChannelV1(objectType, channel) })) return false;
	if (!assertArray({ core, objectType, key:"colors", optional, validator:isEmbedColor })) return false;
	if (!assertNumber({ core, objectType, key:"createdTs" })) return false;
	// dialogPostType, gmCharacterName, mentionPrefix, moveDirectionOutputType, sendDialogTo
	if (!assertDialogOptionsV1(objectType, core)) return false;
	// diceCritMethodType, diceOutputType, dicePostType, diceSecretMethodType, diceSortType, sendDiceTo
	if (!assertDiceOptionsV1(objectType, core)) return false;
	// did --> this needs to become an invalid key
	if (!assertArray({ core, objectType, key:"emoji", optional, validator:isEmoji })) {
		console.log(core);
		return false;
	}
	// core.encounters
	// gameSystemType
	if (!assertGameSystemOptionsV1(objectType, core)) return false;
	if ("gmCharacter" in core && !assertSageCharacterCoreV1(core.gmCharacter!)) return false;
	// id
	if (!assertArray({ core, objectType, key:"macros", optional, validator:isMacroBase })) return false;
	if (!assertString({ core, objectType, key:"name", validator:isNotBlank })) return false;
	core.nonPlayerCharacters
	// objectType

	return true;
}
