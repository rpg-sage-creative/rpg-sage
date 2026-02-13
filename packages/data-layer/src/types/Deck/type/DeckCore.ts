
// import type { DeckCoreV0 } from "./DeckCoreV0.js";
import type { DeckCoreV1 } from "./DeckCoreV1.js";

export type DeckCoreOld = unknown; // DeckCoreV0;
export type DeckCore = DeckCoreV1;
export type DeckCoreAny = DeckCore | DeckCoreOld;