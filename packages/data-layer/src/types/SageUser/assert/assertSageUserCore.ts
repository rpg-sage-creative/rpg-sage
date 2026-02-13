import type { SageUserCore, SageUserCoreAny } from "../type/SageUserCore.js";
import { assertSageUserCoreV1 } from "./assertSageUserCoreV1.js";

export function assertSageUserCore(core: unknown): core is SageUserCore {
	return assertSageUserCoreV1(core as SageUserCoreAny);
}