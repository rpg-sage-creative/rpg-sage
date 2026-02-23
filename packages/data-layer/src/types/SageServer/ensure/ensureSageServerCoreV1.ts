import { updateSageChannel, updateSystemOptions } from "../../../updates/index.js";
import { deleteEmptyArray, ensureIds, type EnsureContext } from "../../../validation/index.js";
import { ensureDialogOptionsV1 } from "../../DialogOptions/ensureDialogOptionsV1.js";
import { ensureDiceOptionsV1 } from "../../DiceOptions/ensureDiceOptionsV1.js";
import type { SageServerCoreV0, SageServerCoreV1 } from "../index.js";

export function ensureSageServerCoreV1(core: SageServerCoreV0, _context?: EnsureContext): SageServerCoreV1 {
	if (core.ver > 0) throw new Error(`cannot convert v${core.ver} to v1`);

	core.id = core.did ?? core.id;
	ensureIds(core);
	core.channels?.forEach(updateSageChannel);
	ensureDialogOptionsV1(core);
	ensureDiceOptionsV1(core);
	delete core.logLevel;
	deleteEmptyArray({ core, key:"macros" });
	delete core.nickName;
	updateSystemOptions(core);
	core.ver = 1;

	return core as SageServerCoreV1;
}