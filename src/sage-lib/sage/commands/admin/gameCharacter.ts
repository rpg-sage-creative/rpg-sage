import { registerAdminCommand } from "../cmd.js";
import { registerAdminCommandHelp } from "../help.js";
import { gcCmdAutoOff } from "./GameCharacter/gcCmdAutoOff.js";
import { gcCmdAutoOn } from "./GameCharacter/gcCmdAutoOn.js";
import { gcCmdCreate } from "./GameCharacter/gcCmdCreate.js";
import { gcCmdDelete } from "./GameCharacter/gcCmdDelete.js";
import { gcCmdDetails } from "./GameCharacter/gcCmdDetails.js";
import { gcCmdList } from "./GameCharacter/gcCmdList.js";
import { gcCmdStats } from "./GameCharacter/gcCmdStats.js";
import { gcCmdUpdate } from "./GameCharacter/gcCmdUpdate.js";

function registerHelp(): void {
	const AdminCategory = "Admin";
	const playerCharacterSubCategory = "PC";
	const nonPlayerCharacterSubCategory = "NPC";
	const companionSubCategory = "Companion";
	[playerCharacterSubCategory, nonPlayerCharacterSubCategory, companionSubCategory].forEach(subCat => {
		const charName = subCat === companionSubCategory ? ` charname="character name"` : ``;
		const cmd = subCat.toLowerCase();
		registerAdminCommandHelp(AdminCategory, subCat, `${cmd} list "optional filter"`);
		registerAdminCommandHelp(AdminCategory, subCat, `${cmd} details "name"`);
		registerAdminCommandHelp(AdminCategory, subCat, `${cmd} create ${charName} name="name" avatar="image url" token="image url"`);
		registerAdminCommandHelp(AdminCategory, subCat, `${cmd} update ${charName} name="name" avatar="image url"`);
		registerAdminCommandHelp(AdminCategory, subCat, `${cmd} update ${charName} oldname="old name" newname="new name"`);
		registerAdminCommandHelp(AdminCategory, subCat, `${cmd} delete ${charName} name="name"`);
	});
}

export function registerGameCharacter(): void {
	registerAdminCommand(gcCmdList, "pc-list", "pcs-list", "my-pc-list", "my-pcs");
	registerAdminCommand(gcCmdList, "npc-list", "npcs-list", "my-npc-list", "my-npcs");
	registerAdminCommand(gcCmdList, "companion-list", "my-companion-list", "my-companions");
	registerAdminCommand(gcCmdList, "minion-list", "my-minion-list", "my-minions");
	registerAdminCommand(gcCmdDetails, "pc-details", "npc-details", "companion-details", "gm-details", "minion-details");
	registerAdminCommand(gcCmdCreate, `pc-create`, `npc-create`, `companion-create`, `minion-create`);
	registerAdminCommand(gcCmdUpdate, "pc-update", "npc-update", "companion-update", "gm-update", "minion-update");
	registerAdminCommand(gcCmdStats, "pc-stats", "npc-stats", "companion-stats", "minion-stats");
	registerAdminCommand(gcCmdDelete, "pc-delete", "npc-delete", "companion-delete", "minion-delete");
	registerAdminCommand(gcCmdAutoOn, "pc-auto-on", "gm-auto-on", "npc-auto-on", "minion-auto-on", "companion-auto-on");
	registerAdminCommand(gcCmdAutoOff, "pc-auto-off", "gm-auto-off", "npc-auto-off", "minion-auto-off", "companion-auto-off");
	// registerAdminCommand(characterLink, "pc-link", "npc-link", "companion-link", "minion-link");

	registerHelp();
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