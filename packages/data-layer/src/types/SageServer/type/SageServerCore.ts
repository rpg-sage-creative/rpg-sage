import type { SageServerCoreV0 } from "./SageServerCoreV0.js";
import type { SageServerCoreV1 } from "./SageServerCoreV1.js";

export type SageServerCoreOld = SageServerCoreV0;
export type SageServerCore = SageServerCoreV1;
export type SageServerCoreAny = SageServerCore | SageServerCoreOld;