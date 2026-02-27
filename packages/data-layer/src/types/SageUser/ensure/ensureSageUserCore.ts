import type { EnsureContext } from "../../../validation/index.js";
import { ensureSageUserCoreV1, type SageUserCore, type SageUserCoreAny, type SageUserCoreV0 } from "../index.js";

export function ensureSageUserCore(core: SageUserCoreAny, context?: EnsureContext): SageUserCore {
	core = ensureSageUserCoreV1(core as SageUserCoreV0, context);
	return core as SageUserCore;
}