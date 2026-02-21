import { coreNeedsUpdate, type EnsureOptions } from "../../../validation/index.js";
import { ensureSageServerCoreV1, type SageServerCore, type SageServerCoreAny, type SageServerCoreV0 } from "../index.js";

export function ensureSageServerCore(core: SageServerCoreAny, { context, ver = 1 }: EnsureOptions): SageServerCore {
	if (coreNeedsUpdate(core, ver)) {
		core = ensureSageServerCoreV1(core as SageServerCoreV0, context);
	}
	return core as SageServerCore;
}