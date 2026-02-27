import type { Snowflake } from "@rsc-utils/core-utils";
import { ensureArray, ensureIds, ensureTypedArray, isAlias, isMacroBase, isNote, optional, renameProperty, type EnsureContext } from "../../../validation/index.js";
import { ensureSageCharacterCore, type SageUserCoreV0, type SageUserCoreV1 } from "../../index.js";

export function ensureSageUserCoreV1(core: SageUserCoreV0, context?: EnsureContext): SageUserCoreV1 {

	ensureIds(core);

	ensureTypedArray({ core, key:"aliases", typeGuard:isAlias, optional });
	renameProperty({ core, oldKey:"characters", newKey:"playerCharacters" });
	ensureTypedArray({ core, key:"macros", typeGuard:isMacroBase, optional });
	delete core.nonPlayerCharacters;
	ensureTypedArray({ core, key:"notes", typeGuard:isNote, optional });
	ensureArray({ core, key:"playerCharacters", handler:ensureSageCharacterCore, optional, context:{ ...context, userId:core.id as Snowflake } });
	delete core.patronTier;

	return core as SageUserCoreV1;
}