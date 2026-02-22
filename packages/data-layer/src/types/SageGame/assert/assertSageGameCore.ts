import type { SageGameCore, SageGameCoreAny } from "../type/SageGameCore.js";
import { assertSageGameCoreV1 } from "./assertSageGameCoreV1.js";

export function assertSageGameCore(core: unknown): core is SageGameCore {
	return assertSageGameCoreV1(core as SageGameCoreAny);
}