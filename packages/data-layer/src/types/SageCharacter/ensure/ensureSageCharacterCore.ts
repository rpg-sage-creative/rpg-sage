import type { EnsureContext } from "../../../validation/index.js";
import { ensureSageCharacterCoreV1, type SageCharacterCore, type SageCharacterCoreAny, type SageCharacterCoreV0 } from "../index.js";

export function ensureSageCharacterCore(core: SageCharacterCoreAny, context?: EnsureContext): SageCharacterCore {
	core = ensureSageCharacterCoreV1(core as SageCharacterCoreV0, context);
	return core as SageCharacterCore;
}