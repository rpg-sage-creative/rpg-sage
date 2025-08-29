import { escapeRegex, type Optional } from "@rsc-utils/core-utils";
import type { CharacterManager } from "../../../model/CharacterManager.js";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { createAdminRenderableContent } from "../../cmd.js";

function filterCharacters(characters: Optional<CharacterManager>, value: Optional<string>): GameCharacter[] {
	if (characters) {
		if (value) {
			const regex = new RegExp(escapeRegex(value), "i");
			return characters.filter(({ alias, name }) => regex.test(name) || alias && regex.test(alias));
		}
		return characters.slice();
	}
	return [];
}

export async function sendGameCharactersOrNotFound(sageMessage: SageMessage, characterManager: Optional<CharacterManager>, entityNamePlural?: string): Promise<void> {
	const { charName, name } = sageMessage.args.getNames();
	const nameFilter = (charName ?? name)?.trim();
	const characters = filterCharacters(characterManager, nameFilter);

	const renderableContent = createAdminRenderableContent(sageMessage.getHasColors());
	renderableContent.append(`## ${entityNamePlural} (${characters.length})`)
	if (nameFilter) {
		renderableContent.append(`<b>Filtered by:</b> ${nameFilter}`);
	}

	if (characters.length) {

		let nameIndex = 0;
		for (const character of characters) {
			if (!character.name) {
				character.name = nameIndex ? `Unnamed Character ${nameIndex}` : `Unnamed Character`;
				nameIndex++;
				await character.save();
			}

			renderableContent.append(`### ${character.name}`);

			const hasOwner = !!character.userDid || character.isPc;
			const hasParent = character.isCompanionOrMinion;
			const hasCompanions = character.companions.length > 0;

			const charInfo: string[] = [];
			if (hasOwner || hasCompanions || hasParent) {
				if (hasOwner) {
					const ownerOrPlayer = character.isGmOrNpc ? "Owner" : "Player";
					const owner = await sageMessage.fetchReadableUser(character.userDid);
					const ownerTag = owner ?? "<i>none</i>";
					charInfo.push(`<b>${ownerOrPlayer}</b> ${ownerTag}`);
				}

				if (hasCompanions) {
					const companionType = character.isPc ? `Companions` : `Minions`;
					if (character.companions.length) {
						const companionNames = character.companions.map(companion => `\n- ${companion.name}`).join("");
						charInfo.push(`<b>${companionType}</b>${companionNames}`);
					}else {
						charInfo.push(`<b>${companionType}</b> <i>none</i>`);
					}
				}

				if (hasParent) {
					const parentTag = character.parent?.name ?? "<i>none</i>";
					charInfo.push(`<b>Character</b> ${parentTag}`);
				}
			}

			const charNameKeyValue = `name="${character.name}"`;
			const parentNameKeyValue = hasParent ? `charName="${character.parent?.name}" ` : ``;
			charInfo.push(`\`sage! ${characterManager?.characterType} details ${parentNameKeyValue}${charNameKeyValue}\``);

			renderableContent.appendBlock(...charInfo);
		}

	}

	await sageMessage.send(renderableContent);
}