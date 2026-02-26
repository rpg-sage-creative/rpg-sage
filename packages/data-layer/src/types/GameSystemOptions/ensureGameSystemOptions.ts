import { renameProperty } from "../../validation/index.js";
import type { GameSystemOptionsOld, GameSystemOptions } from "./GameSystemOptions.js";

export function ensureGameSystemOptions(core: GameSystemOptionsOld): GameSystemOptions {

	renameProperty({ core, oldKey:"defaultGame", newKey:"gameSystemType" });
	renameProperty({ core, oldKey:"defaultGameType", newKey:"gameSystemType" });
	renameProperty({ core, oldKey:"gameType", newKey:"gameSystemType" });

	return core;
}