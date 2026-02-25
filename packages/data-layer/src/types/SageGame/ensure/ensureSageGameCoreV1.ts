import { isNotBlank, type Snowflake } from "@rsc-utils/core-utils";
import { assertArray, assertNumber, deleteEmptyArray, ensureArray, type EnsureContext, ensureIds, isSimpleObject, optional, renameProperty } from "../../../validation/index.js";
import { EmojiType, ensureDialogOptionsV1, ensureDiceOptionsV1, ensureGameSystemOptionsV1, ensureSageChannelV1, ensureSageCharacterCoreV1, GameUserType, type Emoji, type SageCharacterCoreV0, type SageGameCoreV0, type SageGameCoreV1 } from "../../index.js";

function ensureEmoji(emoji: unknown): Emoji | undefined {
	return isSimpleObject<Emoji>(emoji)
		&& assertNumber({ core:emoji, objectType:"Emoji", key:"type", validator:EmojiType })
		&& emoji.matches.length
		&& assertArray({ core:emoji, objectType:"Emoji", key:"matches", validator:isNotBlank })
		&& isNotBlank(emoji.replacement)
		? emoji : undefined;
}

export function ensureSageGameCoreV1(core: SageGameCoreV0, context?: EnsureContext): SageGameCoreV1 {
	if (core.ver > 0) throw new Error(`cannot convert v${core.ver} to v1`);

	ensureIds(core);

	ensureDialogOptionsV1(core);
	ensureDiceOptionsV1(core);
	ensureGameSystemOptionsV1(core);
	renameProperty({ core, oldKey:"type", newKey:"gameSystemType" });

	ensureArray({ core, key:"channels", handler:ensureSageChannelV1, optional , context:{ ...context, gameId:core.id as Snowflake }});
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
