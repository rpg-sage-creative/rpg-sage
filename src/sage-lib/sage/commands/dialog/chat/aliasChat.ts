import type SageMessage from "../../../model/SageMessage";
import type { DialogContent } from "../DialogContent";
import { updateAliasDialogArgsAndReturnType } from "../updateAliasDialogArgsAndReturnType";
import type { ChatOptions } from "./ChatOptions";
import { companionChat } from "./companionChat";
import { gmChat } from "./gmChat";
import { npcChat } from "./npcChat";
import { pcChat } from "./pcChat";

export async function aliasChat(sageMessage: SageMessage, dialogContent: DialogContent, options: ChatOptions): Promise<void> {
	if (dialogContent) {
		const updatedDialogContent = updateAliasDialogArgsAndReturnType(sageMessage, dialogContent);
		if (updatedDialogContent) {
			switch (updatedDialogContent.type) {
				case "gm":
					return gmChat(sageMessage, updatedDialogContent, options);
				case "npc": case "ally": case "enemy": case "boss": case "minion":
					return npcChat(sageMessage, updatedDialogContent, options);
				case "pc":
					return pcChat(sageMessage, updatedDialogContent, options);
				case "alt": case "companion": case "familiar": case "hireling":
					return companionChat(sageMessage, updatedDialogContent, options);
			}
			return sageMessage.reactWarn(`Invalid dialog type in dialog alias: "${updatedDialogContent.type}::"`);
		}else {
			return sageMessage.reactWarn(`Invalid dialog alias: "${dialogContent.alias ?? dialogContent.type}::"`);
		}
	}
}