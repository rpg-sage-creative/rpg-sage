import { updateDialogOptions, updateDiceOptions, updateSageChannel, updateSystemOptions } from "../../../updates/index.js";
import { deleteEmptyArray, ensureIds, type EnsureContext } from "../../../validation/index.js";
import type { SageServerCoreV0, SageServerCoreV1 } from "../index.js";

export function ensureSageServerCoreV1(core: SageServerCoreV0, _context?: EnsureContext): SageServerCoreV1 {
	if (core.ver > 0) throw new Error(`cannot convert v${core.ver} to v1`);

	core.id = core.did ?? core.id;
	ensureIds(core);
	deleteEmptyArray({ core, key:"macros" });
	updateDialogOptions(core);
	updateDiceOptions(core);
	updateSystemOptions(core);
	core.channels?.forEach(updateSageChannel);
	core.ver = 1;

	return core as SageServerCoreV1;
}