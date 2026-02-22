import type { SageGameCoreV0 } from "./SageGameCoreV0.js";
import type { SageGameCoreV1 } from "./SageGameCoreV1.js";

export type SageGameCoreOld = SageGameCoreV0;
export type SageGameCore = SageGameCoreV1;
export type SageGameCoreAny = SageGameCore | SageGameCoreOld;