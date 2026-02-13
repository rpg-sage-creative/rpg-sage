import { ensureSageUserCoreV1, type SageUserCore, type SageUserCoreAny } from "../index.js";

export function ensureSageUserCore(core: SageUserCoreAny): SageUserCore {
	core = ensureSageUserCoreV1(core);
	return core as SageUserCore;
}