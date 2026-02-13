import type { SageMessageReferenceCoreV0 } from "./SageMessageReferenceCoreV0.js";
import type { SageMessageReferenceCoreV1 } from "./SageMessageReferenceCoreV1.js";

export type SageMessageReferenceCoreOld = SageMessageReferenceCoreV0;
export type SageMessageReferenceCore = SageMessageReferenceCoreV1;
export type SageMessageReferenceCoreAny = SageMessageReferenceCore | SageMessageReferenceCoreOld;