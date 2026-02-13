import { ensureSageCharacterCoreV1, type SageCharacterCore, type SageCharacterCoreAny } from "../index.js";

export function ensureSageCharacterCore(core: SageCharacterCoreAny): SageCharacterCore {
	core = ensureSageCharacterCoreV1(core);
	return core as SageCharacterCore;
}