import type { SageMessageReferenceCore, SageMessageReferenceCoreAny } from "../type/SageMessageReferenceCore.js";
import { assertSageMessageReferenceCoreV1 } from "./assertSageMessageReferenceCoreV1.js";

export function assertSageMessageReferenceCore(core: unknown): core is SageMessageReferenceCore {
	return assertSageMessageReferenceCoreV1(core as SageMessageReferenceCoreAny);
}