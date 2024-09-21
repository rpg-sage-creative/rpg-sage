import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import { gcCmdAutoOff } from "./GameCharacter/gcCmdAutoOff.js";
import { gcCmdAutoOn } from "./GameCharacter/gcCmdAutoOn.js";
// import { registerGcCmdAutoDialog } from "./GameCharacter/gcCmdAutoDialog.js";
import { gcCmdCreate } from "./GameCharacter/gcCmdCreate.js";
import { gcCmdDelete } from "./GameCharacter/gcCmdDelete.js";
import { gcCmdDetails } from "./GameCharacter/gcCmdDetails.js";
import { gcCmdList } from "./GameCharacter/gcCmdList.js";
import { gcCmdStats } from "./GameCharacter/gcCmdStats.js";
import { gcCmdUpdate } from "./GameCharacter/gcCmdUpdate.js";

export function registerGameCharacter(): void {
	registerListeners({ commands:["pc|list", "pcs|list", "my|pc|list", "my|pcs"], message:gcCmdList });
	registerListeners({ commands:["npc|list", "npcs|list", "my|npc|list", "my|npcs"], message:gcCmdList });
	registerListeners({ commands:["companion|list", "my|companion|list", "my|companions"], message:gcCmdList });
	registerListeners({ commands:["minion|list", "my|minion|list", "my|minions"], message:gcCmdList });
	registerListeners({ commands:["pc|details", "npc|details", "companion|details", "gm|details", "minion|details"], message:gcCmdDetails });
	registerListeners({ commands:[`pc|create`, `npc|create`, `companion|create`, `minion|create`], message:gcCmdCreate });
	registerListeners({ commands:["pc|update", "npc|update", "companion|update", "gm|update", "minion|update"], message:gcCmdUpdate });
	registerListeners({ commands:["pc|stats", "npc|stats", "companion|stats", "minion|stats"], message:gcCmdStats });
	registerListeners({ commands:["pc|delete", "npc|delete", "companion|delete", "minion|delete"], message:gcCmdDelete });
	registerListeners({ commands:["pc|auto|on", "gm|auto|on", "npc|auto|on", "minion|auto|on", "companion|auto|on"], message:gcCmdAutoOn });
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