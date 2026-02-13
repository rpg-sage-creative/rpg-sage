import { deleteEmptyArray, ensureArray, renameProperty } from "../../../validation/index.js";
import type { SageUserCoreV0, SageUserCoreV1 } from "../index.js";

export function ensureSageUserCoreV1(core: SageUserCoreV0): SageUserCoreV1 {
	if (core.ver > 0) throw new Error(`cannot convert v${core.ver} to v1`);
	deleteEmptyArray({ core, key:"aliases" });
	renameProperty({ core, oldKey:"characters", newKey:"playerCharacters" })
	deleteEmptyArray({ core, key:"macros" });
	deleteEmptyArray({ core, key:"nonPlayerCharacters" });
	deleteEmptyArray({ core, key:"notes" });
	// core.playerCharacters = core.playerCharacters?.map(char => (char.ver > 0 ? char : characterV1FromV0(char)) ?? [];
	ensureArray;//({ core, key:"playerCharacters", handler:characterV1FromV0, ver:1 });
	deleteEmptyArray({ core, key:"playerCharacters" });
	delete core.patronTier;
	core.ver = 1;
	return core as SageUserCoreV1;
}