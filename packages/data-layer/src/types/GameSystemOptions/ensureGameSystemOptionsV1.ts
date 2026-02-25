import { renameProperty } from "../../validation/index.js";
import type { GameSystemOptionsV0, GameSystemOptionsV1 } from "./GameSystemOptions.js";

export function ensureGameSystemOptionsV1(core: GameSystemOptionsV0): GameSystemOptionsV1 {

	renameProperty({ core, oldKey:"defaultGame", newKey:"gameSystemType" });
	renameProperty({ core, oldKey:"defaultGameType", newKey:"gameSystemType" });
	renameProperty({ core, oldKey:"gameType", newKey:"gameSystemType" });

	return core;
}