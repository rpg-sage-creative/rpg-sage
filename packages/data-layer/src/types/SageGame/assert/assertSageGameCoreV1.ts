import { assertSageCore } from "../../../validation/index.js";
import { SageGameV1Keys, type SageGameCoreAny, type SageGameCoreV1 } from "../index.js";

const objectType = "Game";
export function assertSageGameCoreV1(core: SageGameCoreAny): core is SageGameCoreV1 {
	if (!assertSageCore<SageGameCoreV1>(core, objectType, SageGameV1Keys)) return false;

	return true;
}
