import type { GameMapData } from "../types/GameMapData.js";
import type { GameMapCoreV1 } from "./v1/GameMapCoreV1.js";
import { updateGameMapCoreV1 } from "./v1/updateGameMapCoreV1.js";

type Core = GameMapData | GameMapCoreV1;

/** @internal A single place to make sure a map's core is up to date. */
export function updateGameMapCore(core: Core): GameMapData {
	if ("ver" in core) {
		return core;
	}
	return updateGameMapCoreV1(core);
}
