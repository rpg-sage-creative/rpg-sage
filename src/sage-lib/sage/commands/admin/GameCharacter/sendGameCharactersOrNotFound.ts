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

function charToDetails(character: GameCharacter): string {
	if (character.alias) {
		return `\`sage! ${character.alias} details\``;
	}
	const charNameKeyValue = `name="${character.name}"`;
	const parentNameKeyValue = character.isCompanionOrMinion ? `charName="${character.parent?.name}" ` : ``;
	return `\`sage! ${character.type} details ${parentNameKeyValue}${charNameKeyValue}\``;
}

export async function sendGameCharactersOrNotFound(sageMessage: SageMessage, characterManager: Optional<CharacterManager>, entityNamePlural?: string): Promise<void> {
	const isCompanionOrMinion = characterManager?.characterType === "companion" || characterManager?.characterType === "minion";

	const { charName, name } = sageMessage.args.getNames();
	const nameFilter = isCompanionOrMinion ? name : charName ?? name;
	const characters = filterCharacters(characterManager, nameFilter?.trim());

	const renderableContent = createAdminRenderableContent(sageMessage.getHasColors());

	const singleParent = characters.reduce((parent, char) => parent === char.parent ? parent : undefined, characters[0]?.parent);
	if (singleParent) {
		renderableContent.append(`## ${singleParent.name}`);
	}

	const isGame = !!sageMessage.game;
	if (isGame) {
		renderableContent.append(`## ${sageMessage.game.name}`)
	}

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

			const hasAlias = !!character.alias;
			const hasOwner = isGame ? !!character.userDid || character.isPc : false;
			const hasParent = character.isCompanionOrMinion && !singleParent;
			const hasCompanions = character.companions.length > 0;

			const charInfo: string[] = [];
			if (hasAlias || hasOwner || hasCompanions || hasParent) {

				if (hasOwner) {
					const ownerOrPlayer = character.isGmOrNpc ? "Owner" : "Player";
					const owner = await sageMessage.fetchReadableUser(character.userDid);
					const ownerTag = owner ?? "<i>none</i>";
					charInfo.push(`<b>${ownerOrPlayer}</b> ${ownerTag}`);
				}

				if (hasAlias) {
					charInfo.push(`<b>Alias</b> ${character.alias}`);
				}

				charInfo.push(charToDetails(character));

				if (hasCompanions) {
					const companionType = character.isPc ? `Companions` : `Minions`;
					if (character.companions.length) {
						const companionNames = character.companions.map(companion => `\n- ${companion.name}\n  - ${charToDetails(companion)}`).join("");
						charInfo.push(`\n<b>${companionType}</b>${companionNames}`);
					}else {
						charInfo.push(`\n<b>${companionType}</b> <i>none</i>`);
					}
				}

				if (hasParent) {
					const parentTag = character.parent?.name ?? "<i>none</i>";
					charInfo.push(`<b>Character</b> ${parentTag}`);
				}

			}else {

				charInfo.push(charToDetails(character));
			}

			renderableContent.appendBlock(...charInfo);
		}

	}

	await sageMessage.send(renderableContent);
}