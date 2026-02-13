
import type { SageCharacterCoreV0 } from "./SageCharacterCoreV0.js";
import type { SageCharacterCoreV1 } from "./SageCharacterCoreV1.js";

export type SageCharacterCoreOld = SageCharacterCoreV0;
export type SageCharacterCore = SageCharacterCoreV1;
export type SageCharacterCoreAny = SageCharacterCore | SageCharacterCoreOld;