import { renameProperty } from "../../validation/index.js";
import type { DeckCore, DeckCoreOld } from "./DeckCore.js";

export function ensureDeckCore(core: DeckCoreOld): DeckCore {
	if ("drawn" in core) {
		if (!("drawPile" in core)) {
			renameProperty({ core, oldKey:"drawn", newKey:"drawPile"});
		}else {
			delete core.drawn;
		}
	}

	if (!core.cardCount) {
		core.cardCount = (core.discardPile?.length ?? 0)
			+ (core.drawPile?.length ?? 0)
			+ (core.hand?.length ?? 0)
			+ (core.spread?.length ?? 0);
	}

	if (core.type === "Default52" as any) core.type = "English52";
	if (core.type === "Default54" as any) core.type = "English54";

	return core;
}