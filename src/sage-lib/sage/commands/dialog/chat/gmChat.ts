import type { DialogContent } from "@rsc-utils/game-utils";
import { ColorType } from "../../../model/HasColorsCore.js";
import { SageMessage } from "../../../model/SageMessage.js";
import { findGm } from "../find/findGm.js";
import type { ChatOptions } from "./ChatOptions.js";
import { doChat } from "./doChat.js";

export async function gmChat(sageMessage: SageMessage, dialogContent: DialogContent, options: ChatOptions): Promise<void> {
	const gm = await findGm(sageMessage);
	if (gm) {
		await doChat(sageMessage, { character:gm, colorType:ColorType.GameMaster, dialogContent }, options);
	}else {
		await sageMessage.reactWarn(`Unable to find GM for dialog!`);
	}
}