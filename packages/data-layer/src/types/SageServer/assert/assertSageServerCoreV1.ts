import { isNonNilSnowflake, isNotBlank } from "@rsc-utils/core-utils";
import { assertSageChannel, type SageChannel, type SageChannelAny } from "../../../index.js";
import { assertArray, assertNumber, assertSageCore, assertString, isMacroBase, optional } from "../../../validation/index.js";
import { assertDialogOptionsV1 } from "../../DialogOptions/assertDialogOptionsV1.js";
import { assertDiceOptionsV1 } from "../../DiceOptions/assertDiceOptionsV1.js";
import { assertGameSystemOptionsV1 } from "../../GameSystemOptions/assertGameSystemOptionsV1.js";
import { assertSageCharacterCoreV1 } from "../../SageCharacter/index.js";
import { GameCreatorType, isAdminRole, isAdminUser, isEmbedColor, isEmoji } from "../../enums/index.js";
import { SageServerV1Keys, type SageServerCoreAny, type SageServerCoreV1 } from "../index.js";

function isSageChannel(channel: unknown): channel is SageChannel {
	return assertSageChannel(objectType, channel as SageChannelAny);
}

const objectType = "Server";
export function assertSageServerCoreV1(core: SageServerCoreAny): core is SageServerCoreV1 {
	if (!assertSageCore<SageServerCoreV1>(core, objectType, SageServerV1Keys)) return false;

	if (!assertArray({ core, objectType, key:"admins", optional, validator:isAdminUser })) return false;
	if (!assertArray({ core, objectType, key:"channels", optional, validator:isSageChannel })) return false;
	if (!assertArray({ core, objectType, key:"colors", optional, validator:isEmbedColor })) return false;
	if (!assertString({ core, objectType, key:"commandPrefix", optional })) return false;
	// dialogPostType, gmCharacterName, mentionPrefix, moveDirectionOutputType, sendDialogTo
	if (!assertDialogOptionsV1(objectType, core)) return false;
	// diceCritMethodType, diceOutputType, dicePostType, diceSecretMethodType, diceSortType, sendDiceTo
	if (!assertDiceOptionsV1(objectType, core)) return false;
	// did --> this needs to become an invalid key
	if (!assertArray({ core, objectType, key:"emoji", optional, validator:isEmoji })) return false;
	if (!assertNumber({ core, objectType, key:"gameCreatorType", optional, validator:GameCreatorType })) return false;
	if (!assertString({ core, objectType, key:"gameId", optional, validator:isNonNilSnowflake })) return false;
	// gameSystemType
	if (!assertGameSystemOptionsV1(objectType, core)) return false;
	if ("gmCharacter" in core && !assertSageCharacterCoreV1(core.gmCharacter!)) return false;
	// id
	if (!assertArray({ core, objectType, key:"macros", optional, validator:isMacroBase })) return false;
	if (!assertString({ core, objectType, key:"name", optional, validator:isNotBlank })) return false;
	// objectType
	if (!assertArray({ core, objectType, key:"roles", optional, validator:isAdminRole })) return false;
	// uuid --> this needs to become an invalid key
	// ver

	return true;
}
