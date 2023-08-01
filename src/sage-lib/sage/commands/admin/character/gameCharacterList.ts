import { Optional } from "../../../../../sage-utils";
import { CharacterManager } from "../../../model/CharacterManager";
import { GameCharacter } from "../../../model/GameCharacter";
import { SageMessage } from "../../../model/SageMessage";
import { createAdminRenderableContent } from "../../cmd";
import { sendCharListForm } from "./charListForm";
import { getCharacterTypeMeta } from "./getCharacterTypeMeta";
import { getUserDid } from "./getUserDid";
import { sendGameCharacter } from "./sendGameCharacter";
import { sendNotFound } from "./sendNotFound";
import { testCanAdminCharacter } from "./testCanAdminCharacter";

export async function gameCharacterList(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("List Characters");
	if (denial) {
		return denial;
	}

	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		return sageMessage.reactBlock("You don't have access to those characters!");
	}

	const hasCharacters = sageMessage.game && !characterTypeMeta.isMy ? sageMessage.game : sageMessage.actor.s;

	let characterManager: Optional<CharacterManager> = characterTypeMeta.isGmOrNpcOrMinion
		? await hasCharacters.fetchNonPlayerCharacters()
		: await hasCharacters.fetchPlayerCharacters();
	if (characterTypeMeta.isCompanion) {
		const userDid = getUserDid(sageMessage),
			charName = sageMessage.args.valueByKey("charName"),
			characterName = charName ?? (await sageMessage.fetchPlayerCharacter())?.name,
			character = characterManager.findByUserAndName(userDid, characterName);
		characterManager = character?.companions;
	}else if (characterTypeMeta.isMinion) {
		const names = sageMessage.args.findNames(),
			characterName = names.charName ?? names.name,
			character = characterManager.findByName(characterName);
		characterManager = character?.companions;
	}

	if (characterManager) {
		return sendCharListForm(sageMessage, characterManager);
	}
	return sendGameCharactersOrNotFound(sageMessage, characterManager, `${characterTypeMeta.commandDescriptor}-list`, characterTypeMeta.pluralDescriptor!);
}

async function sendGameCharactersOrNotFound(sageMessage: SageMessage, characterManager: Optional<CharacterManager>, command: string, entityNamePlural: string): Promise<void> {
	const nameFilter = sageMessage.args.valueByKey("filter"),
		hasNameFilter = nameFilter?.length,
		characters: GameCharacter[] = hasNameFilter ? characterManager?.filterByName(nameFilter, true) ?? [] : characterManager?.slice() ?? [];
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
			let webhookError = false;
			await sendGameCharacter(sageMessage, character).catch(err => {
				if (err.startsWith("Cannot Find Webhook: ")) {
					webhookError = true;
				}
			});
			if (webhookError) {
				await sageMessage.whisper(`We are sorry! *(An error occurred and we can't list your characters.)*`);
				break;
			}
		}
	} else {
		await sendNotFound(sageMessage, command, entityNamePlural, nameFilter);
	}
	return Promise.resolve();
}
