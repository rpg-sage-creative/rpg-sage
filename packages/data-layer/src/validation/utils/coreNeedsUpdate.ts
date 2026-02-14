import type { HasVer } from "../../types/index.js";

export function coreNeedsUpdate(core: HasVer, ver: number): boolean {
	return !core.ver || core.ver < ver;
}