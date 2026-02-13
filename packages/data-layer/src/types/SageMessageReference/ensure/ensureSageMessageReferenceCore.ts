import type { SageMessageReferenceCore, SageMessageReferenceCoreAny } from "../index.js";
import { ensureSageMessageReferenceCoreV1 } from "./ensureSageMessageReferenceCoreV1.js";

/** Future proofed router. It should run each ensure in order. */
export function ensureSageMessageReferenceCore(core: SageMessageReferenceCoreAny): SageMessageReferenceCore {
	core = ensureSageMessageReferenceCoreV1(core);
	return core;
}