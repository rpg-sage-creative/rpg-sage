import type { SageUserCoreV0 } from "./SageUserCoreV0.js";
import type { SageUserCoreV1 } from "./SageUserCoreV1.js";

export type SageUserCoreOld = SageUserCoreV0;
export type SageUserCore = SageUserCoreV1;
export type SageUserCoreAny = SageUserCore | SageUserCoreOld;