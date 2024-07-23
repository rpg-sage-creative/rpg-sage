import { discordPromptYesNo } from "../../../../discord/prompts";
import type { GameCharacter } from "../../../model/GameCharacter";
import type { SageMessage } from "../../../model/SageMessage";
import { createAdminRenderableContent } from "../../cmd";
import { sendGameCharacter } from "./sendGameCharacter";

export async function promptCharConfirm(sageMessage: SageMessage, character: GameCharacter, prompt: string, action: (char: GameCharacter) => Promise<boolean>): Promise<void> {
	await sendGameCharacter(sageMessage, character);
	const promptRenderable = createAdminRenderableContent(sageMessage.getHasColors());
	promptRenderable.append(prompt);
	const yes = await discordPromptYesNo(sageMessage, promptRenderable, true);
	if (yes === true) {
		const updated = await action(character);
		await sageMessage.reactSuccessOrFailure(updated);
	}
}