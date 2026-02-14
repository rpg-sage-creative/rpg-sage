import { coreNeedsUpdate, type EnsureOptions } from "../../../validation/index.js";
import type { SageMessageReferenceCore, SageMessageReferenceCoreAny, SageMessageReferenceCoreV0 } from "../index.js";
import { ensureSageMessageReferenceCoreV1 } from "./ensureSageMessageReferenceCoreV1.js";

/** Future proofed router. It should run each ensure in order. */
export function ensureSageMessageReferenceCore(core: SageMessageReferenceCoreAny, { context, ver = 1 }: EnsureOptions): SageMessageReferenceCore {
	if (coreNeedsUpdate(core, ver) || "timestamp" in core) {
		core.ver = 0;
		core = ensureSageMessageReferenceCoreV1(core as SageMessageReferenceCoreV0, context);
	}
	return core as SageMessageReferenceCore;
}