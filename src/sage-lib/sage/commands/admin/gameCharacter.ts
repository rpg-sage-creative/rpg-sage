import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import { gcCmdAutoOff } from "./GameCharacter/gcCmdAutoOff.js";
import { gcCmdAutoOn } from "./GameCharacter/gcCmdAutoOn.js";
// import { registerGcCmdAutoDialog } from "./GameCharacter/gcCmdAutoDialog.js";
import { gcCmdCreate } from "./GameCharacter/gcCmdCreate.js";
import { gcCmdDelete } from "./GameCharacter/gcCmdDelete.js";
import { gcCmdExport } from "./GameCharacter/gcCmdExport.js";
import { gcCmdImport } from "./GameCharacter/gcCmdImport.js";
import { gcCmdList } from "./GameCharacter/gcCmdList.js";
import { gcCmdUpdate } from "./GameCharacter/gcCmdUpdate.js";

export function registerGameCharacter(): void {
	registerListeners({ commands:["pc|list", "pcs|list", "npc|list", "npcs|list", "companion|list", "minion|list"], message:gcCmdList });
	registerListeners({ commands:[`pc|create`, `npc|create`, `companion|create`, `minion|create`], message:gcCmdCreate });
	registerListeners({ commands:[/(?<object>pc|npc|companion|minion|gm)\s*(?<verb>details|update|stats)/i, /(?<alias>\w+)/i], message:gcCmdUpdate });
	registerListeners({ commands:["pc|delete", "npc|delete", "companion|delete", "minion|delete"], message:gcCmdDelete });
	registerListeners({ commands:["pc|auto|on", "gm|auto|on", "npc|auto|on", "minion|auto|on", "companion|auto|on"], message:gcCmdAutoOn });
	registerListeners({ commands:[/(?<object>pc|npc|companion|minion|gm)\s*(?<verb>import)/i], message:gcCmdImport });
	registerListeners({ commands:[/(?<object>pc|npc|companion|minion|gm)\s*(?<verb>export)/i], message:gcCmdExport });
	// registerGcCmdAutoDialog();
	registerListeners({ commands:["pc|auto|off", "gm|auto|off", "npc|auto|off", "minion|auto|off", "companion|auto|off"], message:gcCmdAutoOff });
	// registerListeners({ commands:["pc-link", "npc-link", "companion-link", "minion-link"], message:characterLink });
}

// async function characterLink(sageMessage: SageMessage): Promise<void> {
// 	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
// 	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
// 		return sageMessage.reactBlock();
// 	}

// 	const names = sageMessage.args.removeAndReturnNames();
// 	const userDid = await getUserDid(sageMessage);
// 	const character = await getCharacter(sageMessage, characterTypeMeta, userDid!, names);
// 	if (!character) {
// 		return sageMessage.reactFailure();
// 	}

// 	/** uuid, snowflake, or just number */
// 	// const id = sageMessage.args.removeKeyValuePair("id");
// 	/** uuid only */
// 	// const uuid = sageMessage.args.removeAndReturnUuid();

// 	// const linkValue = sageMessage.args.join(" ");
// 	// is a pathbuilder id? go check
// 	// is a snowflake? check message for a character sheet with buttons and check buttons for pathbuilder id
// 	// is a url? check last part for snowflake of message to look for post with buttons to find pathbuilder id
// 	// is a number? try to import from pathbuilder

// 	return sageMessage.reactBlock();
// }