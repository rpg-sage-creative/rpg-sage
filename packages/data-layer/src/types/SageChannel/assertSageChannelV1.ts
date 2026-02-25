import { isNonNilSnowflake } from "@rsc-utils/core-utils";
import { assertString } from "../../validation/index.js";
import { assertDialogOptionsV1 } from "../DialogOptions/assertDialogOptionsV1.js";
import { assertDiceOptionsV1 } from "../DiceOptions/assertDiceOptionsV1.js";
import { assertGameSystemOptionsV1 } from "../GameSystemOptions/assertGameSystemOptionsV1.js";
import { assertChannelOptionsV1 } from "../options/ChannelOptions.js";
import type { SageChannelAny, SageChannelV1 } from "./SageChannel.js";

export function assertSageChannelV1(objectType: string, core: SageChannelAny): core is SageChannelV1 {

	if (!assertString({ core, objectType, key:"id", validator:isNonNilSnowflake })) return false;

	if (!assertChannelOptionsV1(objectType, core)) return false;
	if (!assertDialogOptionsV1(objectType, core)) return false;
	if (!assertDiceOptionsV1(objectType, core)) return false;
	if (!assertGameSystemOptionsV1(objectType, core)) return false;

	return true
}