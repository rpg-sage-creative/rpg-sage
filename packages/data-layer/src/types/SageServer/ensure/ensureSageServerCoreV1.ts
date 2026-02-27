import type { Snowflake } from "@rsc-utils/core-utils";
import { deleteInvalidString, ensureArray, ensureIds, optional, type EnsureContext } from "../../../validation/index.js";
import { ensureDialogOptions, ensureDiceOptions, ensureGameSystemOptions, ensureSageChannel } from "../../index.js";
import { ensureSageCharacterCoreV1, type SageCharacterCoreV0 } from "../../SageCharacter/index.js";
import type { SageServerCoreV0, SageServerCoreV1 } from "../index.js";

export function ensureSageServerCoreV1(core: SageServerCoreV0, context?: EnsureContext): SageServerCoreV1 {
	ensureIds(core);

	ensureArray({ core, key:"channels", handler:ensureSageChannel, optional , context:{ ...context, serverId:core.id as Snowflake }});
	ensureDialogOptions(core);
	ensureDiceOptions(core);
	ensureGameSystemOptions(core);
	core.gmCharacter ? core.gmCharacter = ensureSageCharacterCoreV1(core.gmCharacter as SageCharacterCoreV0, context) : delete core.gmCharacter;
	deleteInvalidString({ core, key:"name" });

	delete core.games;
	delete core.logLevel;
	delete core.nickName;

	return core as SageServerCoreV1;
}