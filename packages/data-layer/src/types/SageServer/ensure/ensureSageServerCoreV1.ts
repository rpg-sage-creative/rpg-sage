import type { Snowflake } from "@rsc-utils/core-utils";
import { ensureSageChannelV1 } from "../../../index.js";
import { deleteInvalidString, ensureArray, ensureIds, optional, type EnsureContext } from "../../../validation/index.js";
import { ensureDialogOptionsV1 } from "../../DialogOptions/ensureDialogOptionsV1.js";
import { ensureDiceOptionsV1 } from "../../DiceOptions/ensureDiceOptionsV1.js";
import { ensureGameSystemOptionsV1 } from "../../GameSystemOptions/ensureGameSystemOptionsV1.js";
import { ensureSageCharacterCoreV1, type SageCharacterCoreV0 } from "../../SageCharacter/index.js";
import type { SageServerCoreV0, SageServerCoreV1 } from "../index.js";

export function ensureSageServerCoreV1(core: SageServerCoreV0, context?: EnsureContext): SageServerCoreV1 {
	if (core.ver > 0) throw new Error(`cannot convert v${core.ver} to v1`);

	ensureIds(core);

	ensureArray({ core, key:"channels", handler:ensureSageChannelV1, optional , context:{ ...context, serverId:core.id as Snowflake }});
	ensureDialogOptionsV1(core);
	ensureDiceOptionsV1(core);
	ensureGameSystemOptionsV1(core);
	core.gmCharacter ? core.gmCharacter = ensureSageCharacterCoreV1(core.gmCharacter as SageCharacterCoreV0, context) : delete core.gmCharacter;
	deleteInvalidString({ core, key:"name" });

	core.ver = 1;

	delete core.games;
	delete core.logLevel;
	delete core.nickName;

	return core as SageServerCoreV1;
}