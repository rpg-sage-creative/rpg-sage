import { coreNeedsUpdate, type EnsureOptions } from "../../../validation/index.js";
import { ensureSageUserCoreV1, type SageUserCore, type SageUserCoreAny, type SageUserCoreV0 } from "../index.js";

export function ensureSageUserCore(core: SageUserCoreAny, { context, ver = 1 }: EnsureOptions): SageUserCore {
	if (coreNeedsUpdate(core, ver)) {
		core = ensureSageUserCoreV1(core as SageUserCoreV0, context);
	}
	return core as SageUserCore;
}