import { deleteEmptyArray } from "../../../validation/index.js";
import type { SageCharacterCoreV0 } from "../type/SageCharacterCoreV0.js";
import type { SageCharacterCoreV1 } from "../type/SageCharacterCoreV1.js";

export function ensureSageCharacterCoreV1(core: SageCharacterCoreV0): SageCharacterCoreV1 {
	if (core.ver > 0) throw new Error(`cannot convert v${core.ver} to v1`);
	// delete core.aka;
	deleteEmptyArray({ core, key:"autoChannels" });
	// delete non-url avatarUrl
	deleteEmptyArray({ core, key:"companions" });
	deleteEmptyArray({ core, key:"decks" });
	// delete non-color embedColor
	// essence20
	// essence20Id
	// hephaistos
	// hephaistosId
	// id
	deleteEmptyArray({ core, key:"lastMessages" });
	deleteEmptyArray({ core, key:"macros" });
	// name
	deleteEmptyArray({ core, key:"notes" });
	core.objectType = "Character";
	// pathbuilder
	// pathbuilderId
	// delete non-url tokenUrl
	// userDid
	// uuid
	core.ver = 1;
	return core as SageCharacterCoreV1;
}
