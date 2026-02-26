import { type Snowflake } from "@rsc-utils/core-utils";
import { deleteEmptyArray, ensureArray, ensureIds, optional, renameProperty, type EnsureContext } from "../../../validation/index.js";
import { ensureDialogOptions, ensureDiceOptions, ensureEmoji, ensureGameSystemOptionsV1, ensureSageChannel } from "../../index.js";
import { ensureSageCharacterCoreV1, type SageCharacterCoreV0 } from "../../SageCharacter/index.js";
import { GameUserType, type SageGameCoreV0, type SageGameCoreV1 } from "../index.js";

export function ensureSageGameCoreV1(core: SageGameCoreV0, context?: EnsureContext): SageGameCoreV1 {
	if (core.ver > 0) throw new Error(`cannot convert v${core.ver} to v1`);

	ensureIds(core);

	ensureDialogOptions(core);
	ensureDiceOptions(core);
	ensureGameSystemOptionsV1(core);
	renameProperty({ core, oldKey:"type", newKey:"gameSystemType" });

	ensureArray({ core, key:"channels", handler:ensureSageChannel, optional , context:{ ...context, gameId:core.id as Snowflake }});
	ensureArray({ core, key:"emoji", handler:ensureEmoji, optional });
	deleteEmptyArray({ core, key:"encounters" });
	deleteEmptyArray({ core, key:"parties" });

	if ("gameMasters" in core && core.gameMasters?.length) {
		const users = core.users ??= [];
		core.gameMasters.forEach(({ did }) => users.some(u => u.did === did) ? void 0 : users.push({ did, type:GameUserType.GameMaster, dicePing:true }));
		delete core.gameMasters;
	}
	if ("players" in core && core.players?.length) {
		const users = core.users ??= [];
		core.players.forEach(({ did }) => users.some(u => u.did === did) ? void 0 : users.push({ did, type:GameUserType.Player, dicePing:true }));
		delete core.players;
	}

	const gmUserId = core.users?.find(u => u.type === GameUserType.GameMaster)?.did;
	core.gmCharacter ? core.gmCharacter = ensureSageCharacterCoreV1(core.gmCharacter as SageCharacterCoreV0, { ...context, userId:gmUserId }) : delete core.gmCharacter;

	core.ver = 1;

	return core as SageGameCoreV1;
}
