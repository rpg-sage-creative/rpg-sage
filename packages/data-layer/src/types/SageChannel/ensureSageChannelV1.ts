import { ensureIds, type EnsureOptions } from "../../validation/index.js";
import { ensureDialogOptionsV1 } from "../DialogOptions/index.js";
import { ensureDiceOptionsV1 } from "../DiceOptions/index.js";
import { ensureGameSystemOptionsV1 } from "../GameSystemOptions/index.js";
import { ensureChannelOptionsV1 } from "../options/ChannelOptions.js";
import type { SageChannelV0, SageChannelV1 } from "./SageChannel.js";

export function ensureSageChannelV1(core: SageChannelV0, _?: EnsureOptions): SageChannelV1 {
	ensureIds(core);
	delete core.did;

	ensureChannelOptionsV1(core);
	ensureDialogOptionsV1(core);
	ensureDiceOptionsV1(core);
	ensureGameSystemOptionsV1(core);

	delete core.nickName;
	delete core.sendCommandTo;
	delete core.sendSearchTo;

	return core as SageChannelV1;
}