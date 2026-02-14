import type { Snowflake } from "@rsc-utils/core-utils";
import { deleteEmptyArray, ensureArray, ensureIds, renameProperty, type EnsureContext } from "../../../validation/index.js";
import { ensureSageCharacterCore, type SageUserCoreV0, type SageUserCoreV1 } from "../../index.js";

export function ensureSageUserCoreV1(core: SageUserCoreV0, context?: EnsureContext): SageUserCoreV1 {
	if (core.ver > 0) throw new Error(`cannot convert v${core.ver} to v1`);

	deleteEmptyArray({ core, key:"aliases" });
	renameProperty({ core, oldKey:"characters", newKey:"playerCharacters" });
	core.id = core.did ?? core.id;
	ensureIds(core);
	deleteEmptyArray({ core, key:"macros" });
	delete core.nonPlayerCharacters;
	deleteEmptyArray({ core, key:"notes" });
	ensureArray({ core, key:"playerCharacters", handler:ensureSageCharacterCore, ver:1, context:{ ...context, userId:core.id as Snowflake } });
	deleteEmptyArray({ core, key:"playerCharacters" });
	delete core.patronTier;
	core.ver = 1;

	return core as SageUserCoreV1;
}