import { debug } from "../../../sage-utils/utils/ConsoleUtils";
import { MessageType, ReactionType, TCommandAndArgsAndData } from "../../discord";
import { registerMessageListener, registerReactionListener } from "../../discord/handlers";
import type SageMessage from "../model/SageMessage";
import type { DialogContent } from "./dialog/DialogContent";
import { companionChat } from "./dialog/chat/companionChat";
import { editChat } from "./dialog/chat/editChat";
import { gmChat } from "./dialog/chat/gmChat";
import { npcChat } from "./dialog/chat/npcChat";
import { pcChat } from "./dialog/chat/pcChat";
import { doDelete } from "./dialog/delete/doDelete";
import { isDelete } from "./dialog/delete/isDelete";
import { parseOrAutoDialogContent } from "./dialog/parseOrAutoDialog";
import { doPin } from "./dialog/pin/doPin";
import { isPin } from "./dialog/pin/isPin";
import { registerInlineHelp } from "./help";

/** Returns the dialog content if found or null otherwise. */
async function isDialog(sageMessage: SageMessage): Promise<TCommandAndArgsAndData<DialogContent[]> | null> {
	if (!sageMessage.allowDialog) {
		return null;
	}

	const dialogContents = parseOrAutoDialogContent(sageMessage);
	if (!dialogContents?.length) {
		return null;
	}

	return {
		command: dialogContents.map(d => d.type).join("+"),
		// args: undefined,
		data: dialogContents
	};
}

async function doDialog(sageMessage: SageMessage, dialogContents: DialogContent[]): Promise<void> {
	// we attach the image the first dialog that has (attachment) as an argument, otherwise the first of all dialogs
	const attachmentIndex = Math.max(dialogContents.findIndex(dialogContent => dialogContent.attachment === true), 0);
	for (let index = 0; index < dialogContents.length; index++) {
		const dialogContent = dialogContents[index];
		const options = { skipDelete:index > 0, doAttachment:index === attachmentIndex };
		switch (dialogContent.type) {
			case "npc": case "enemy": case "ally": case "boss": case "minion":
				await npcChat(sageMessage, dialogContent, options);
				break;
			case "gm":
				await gmChat(sageMessage, dialogContent, options);
				break;
			case "pc":
				await pcChat(sageMessage, dialogContent, options);
				break;
			case "alt": case "companion": case "familiar": case "hireling":
				await companionChat(sageMessage, dialogContent, options);
				break;
			case "edit":
				await editChat(sageMessage, dialogContent);
				break;
			default:
				debug(`Invalid dialogContent.type:`, dialogContent);
				break;
		}
	}
}

export default function register(): void {
	registerMessageListener(isDialog, doDialog, { type:MessageType.Both, priorityIndex:0 });
	registerReactionListener(isDelete, doDelete, { type:ReactionType.Add });
	registerReactionListener(isPin, doPin);

	// registerInlineHelp("Dialog", "edit::{content}");
	// registerInlineHelp("Dialog", "{type}::{content}");
	// registerInlineHelp("Dialog", "{type}::{name}::{content}");
	// registerInlineHelp("Dialog", "{type}::{name}(display name)::{content}");
	// registerInlineHelp("Dialog", "{type}::{name}(display name)::(title)::{content}");
	// registerInlineHelp("Dialog", "{type} :: {name} ( {display name} ) :: ( {title} ) :: {color} :: {content}");
	registerInlineHelp("Dialog",
		"\ntype::name(display name)::(title)::color::avatar::content"
		+ "\n - <b>type</b>: gm, npc, enemy, ally, boss, minion, pc, alt, companion, familiar, hireling"
		+ "\n - <b>name</b>: the name of the npc, pc, or companion to post as"
		+ "\n - - <i>optional for PCs in a game</i>"
		+ "\n - <b>display name</b>: the name to post as"
		+ "\n - - <i>optional: defaults to character name or 'Game Master' for GM</i>"
		+ "\n - <b>title</b>: a title or descripiton of the dialog <i>optional</i>"
		+ "\n - <b>color</b>: a color to override the dialog color with"
		+ "\n - - <i>optional: expects hex value 0x000000 or #FFFFFF</i>"
		+ "\n - <b>avatar</b>: a url to override the avatar image"
		+ "\n - - <i>optional</i>"
		+ "\n - <b>content</b>: everything you want to post in your dialog"
		+ "\n - - accepts normal discord/markup as well as custom Sage markup"
		+ "\n"
		+ "\n<u>Examples:</u>"
		+ "\ngm::You see a fork in the road up ahead."
		+ "\ngm::(The Weather turns ...)::The wind picks up, rain begins to fall, and lightning flashes!"
		+ `\nnpc::Seela::"Hello, and well met!"`
		+ `\npc::I move behind the spork to flank and attack!`
		+ "\nedit::I move behind the orc to flank and attack!"
	);
}
