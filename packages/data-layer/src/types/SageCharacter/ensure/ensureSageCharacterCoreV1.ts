import { isSnowflake, type Snowflake } from "@rsc-utils/core-utils";
import { deleteEmptyArray, deleteInvalidHexColorString, deleteInvalidString, deleteInvalidUrl, ensureArray, renameProperty, type EnsureContext } from "../../../validation/index.js";
import { DialogPostType, type AutoChannelData } from "../../other/index.js";
import { ensureSageMessageReferenceCore } from "../../SageMessageReference/index.js";
import type { SageCharacterCoreV0, SageCharacterCoreV1 } from "../type/index.js";
import { ensureSageCharacterCore } from "./ensureSageCharacterCore.js";
import { ensureDeckCore } from "../../Deck/index.js";

function ensureDialogPostType(value?: number): DialogPostType | undefined {
	if (typeof(value) === "number") {
		if (DialogPostType[DialogPostType[value] as keyof typeof DialogPostType] === value) {
			return value;
		}
	}
	return undefined;
}

type AutoChannelDataResolvable = AutoChannelData | string | { channelDid:Snowflake; dialogPostType?:0|1; userDid?:Snowflake; };
function ensureAutoChannel(core: AutoChannelDataResolvable): AutoChannelData {
	if (typeof(core) === "string") return { channelId:core as Snowflake };
	if ("channelDid" in core) {
		return {
			channelId: core.channelDid,
			dialogPostType: ensureDialogPostType(core.dialogPostType),
			userId: core.userDid
		};
	}
	return {
		channelId: core.channelId,
		dialogPostType: ensureDialogPostType(core.dialogPostType),
		userId: core.userId
	};
}

export function ensureSageCharacterCoreV1(core: SageCharacterCoreV0, context?: EnsureContext): SageCharacterCoreV1 {
	if (core.ver > 0) throw new Error(`cannot convert v${core.ver} to v1`);

	// delete core.aka;
	deleteInvalidString({ core, key:"alias" }); // regex:/\w+/i ? ? ?
	ensureArray({ core, key:"autoChannels", handler:ensureAutoChannel });
	deleteEmptyArray({ core, key:"autoChannels" });
	deleteInvalidUrl({ core, key:"avatarUrl" });
	ensureArray({ core, key:"companions", handler:ensureSageCharacterCore, context });
	deleteEmptyArray({ core, key:"companions" });
	ensureArray({ core, key:"decks", handler:ensureDeckCore, context})
	deleteEmptyArray({ core, key:"decks" });
	deleteInvalidHexColorString({ core, key:"embedColor" });
	// essence20
	// essence20Id
	// hephaistos
	// hephaistosId
	renameProperty({ core, oldKey:"iconUrl", newKey:"tokenUrl" });
	// id
	ensureArray({ core, key:"lastMessages", handler:ensureSageMessageReferenceCore, context:{ ...context, characterId:core.id } });
	deleteEmptyArray({ core, key:"lastMessages" });
	deleteEmptyArray({ core, key:"macros" });
	// name
	deleteEmptyArray({ core, key:"notes" });
	core.objectType = "Character";
	// pathbuilder
	// pathbuilderId
	deleteInvalidUrl({ core, key:"tokenUrl" });
	// userDid
	if (!isSnowflake(core.userDid) && context?.userId) {
		core.userDid = context?.userId as Snowflake;
	}
	// uuid
	core.ver = 1;

	return core as SageCharacterCoreV1;
}
