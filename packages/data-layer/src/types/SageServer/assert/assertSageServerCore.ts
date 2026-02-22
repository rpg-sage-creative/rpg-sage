import type { SageServerCore, SageServerCoreAny } from "../type/SageServerCore.js";
import { assertSageServerCoreV1 } from "./assertSageServerCoreV1.js";

export function assertSageServerCore(core: unknown): core is SageServerCore {
	return assertSageServerCoreV1(core as SageServerCoreAny);
}