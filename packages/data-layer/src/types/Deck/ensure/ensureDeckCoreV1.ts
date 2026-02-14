import { renameProperty, type EnsureContext } from "../../../validation/index.js";
import type { DeckCoreV0, DeckCoreV1 } from "../index.js";

export function ensureDeckCoreV1(core: DeckCoreV0, _context?: EnsureContext): DeckCoreV1 {
	if (core.ver > 0) throw new Error(`cannot convert v${core.ver} to v1`);

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

	return core as DeckCoreV1;
}