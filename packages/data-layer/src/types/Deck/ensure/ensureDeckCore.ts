import { coreNeedsUpdate, type EnsureOptions } from "../../../validation/index.js";
import type { DeckCore, DeckCoreAny } from "../type/DeckCore.js";
import { ensureDeckCoreV1 } from "./ensureDeckCoreV1.js";

export function ensureDeckCore(core: DeckCoreAny, { context, ver = 1 }: EnsureOptions): DeckCore {
	if (coreNeedsUpdate(core, ver)) {
		core = ensureDeckCoreV1(core, context);
	}
	return core as DeckCore;
}