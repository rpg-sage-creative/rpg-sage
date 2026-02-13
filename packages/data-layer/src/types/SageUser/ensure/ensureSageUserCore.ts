import { ensureSageUserCoreV1, type SageUserCore, type SageUserCoreAny } from "../index.js";

export function ensureSageUserCore(core: SageUserCoreAny): SageUserCore {
	return ensureSageUserCoreV1(core);
}