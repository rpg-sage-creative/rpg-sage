import { assertSageCore } from "../../../validation/index.js";
import { SageServerV1Keys, type SageServerCoreAny, type SageServerCoreV1 } from "../index.js";

const objectType = "Server";
export function assertSageServerCoreV1(core: SageServerCoreAny): core is SageServerCoreV1 {
	if (!assertSageCore<SageServerCoreV1>(core, objectType, SageServerV1Keys)) return false;

	return true;
}
