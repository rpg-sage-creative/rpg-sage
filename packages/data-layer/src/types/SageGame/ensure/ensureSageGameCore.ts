import { coreNeedsUpdate, type EnsureOptions } from "../../../validation/index.js";
import { ensureSageGameCoreV1, type SageGameCore, type SageGameCoreAny, type SageGameCoreV0 } from "../index.js";

export function ensureSageGameCore(core: SageGameCoreAny, { context, ver = 1 }: EnsureOptions): SageGameCore {
	if (coreNeedsUpdate(core, ver)) {
		core = ensureSageGameCoreV1(core as SageGameCoreV0, context);
	}
	return core as SageGameCore;
}