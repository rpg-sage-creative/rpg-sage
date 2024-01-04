import { ColorType } from "../../../model/HasColorsCore";
import SageMessage from "../../../model/SageMessage";
import { DialogContent } from "../DialogContent";
import { findGm } from "../find/findGm";
import { ChatOptions } from "./ChatOptions";
import { doChat } from "./doChat";

export async function gmChat(sageMessage: SageMessage, dialogContent: DialogContent, options: ChatOptions): Promise<void> {
	const gm = await findGm(sageMessage);
	if (gm) {
		await doChat(sageMessage, { character:gm, colorType:ColorType.GameMaster, dialogContent }, options);
	}else {
		await sageMessage.reactWarn(`Unable to find GM for dialog!`);
	}
}