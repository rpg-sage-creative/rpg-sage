import type { Optional } from "@rsc-utils/type-utils";
import type { CharacterManager } from "../../../model/CharacterManager";
import type { GameCharacter } from "../../../model/GameCharacter";
import type { SageMessage } from "../../../model/SageMessage";
import { createAdminRenderableContent } from "../../cmd";
import { sendGameCharacter } from "./sendGameCharacter";
import { sendNotFound } from "./sendNotFound";

export async function sendGameCharactersOrNotFound(sageMessage: SageMessage, characterManager: Optional<CharacterManager>, command: string, entityNamePlural: string): Promise<void> {
	const nameFilter = sageMessage.args.removeAndReturnName(true),
		hasNameFilter = nameFilter?.length,
		characters: GameCharacter[] = hasNameFilter ? characterManager?.filterByName(nameFilter) ?? [] : characterManager?.slice() ?? [];
	if (characters.length) {
		// Always show the Game Master first
		const gmIndex = characters.findIndex(character => character.isGM);
		if (gmIndex > 0) {
			const gm = characters.splice(gmIndex, 1).pop()!;
			characters.unshift(gm);
		}

		const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `<b>${command}</b>`);
		if (hasNameFilter) {
			renderableContent.append(`<b>Filtered by:</b> ${nameFilter}`);
		}
		renderableContent.append(`<blockquote>${characters.length} ${entityNamePlural} Found!</blockquote>`);
		await sageMessage.send(renderableContent);

		let nameIndex = 0;
		for (const character of characters) {
			if (!character.name) {
				character.name = nameIndex ? `Unnamed Character ${nameIndex}` : `Unnamed Character`;
				nameIndex++;
				await character.save();
			}
			await sendGameCharacter(sageMessage, character);
		}
	} else {
		await sendNotFound(sageMessage, command, entityNamePlural, nameFilter);
	}
	return Promise.resolve();
}