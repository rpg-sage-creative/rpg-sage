import type { EnsureContext } from "../../../validation/index.js";
import { ensureSageServerCoreV1, type SageServerCore, type SageServerCoreAny, type SageServerCoreV0 } from "../index.js";

export function ensureSageServerCore(core: SageServerCoreAny, context?: EnsureContext): SageServerCore {
	core = ensureSageServerCoreV1(core as SageServerCoreV0, context);
	return core as SageServerCore;
}