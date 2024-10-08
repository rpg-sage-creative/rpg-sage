import type { Optional } from "@rsc-utils/core-utils";
import type { CharacterManager } from "../../../model/CharacterManager.js";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { createAdminRenderableContent } from "../../cmd.js";
import { toReadableOwner } from "./toReadableOwner.js";

export async function sendGameCharactersOrNotFound(sageMessage: SageMessage, characterManager: Optional<CharacterManager>, entityNamePlural?: string): Promise<void> {
	const { charName, name } = sageMessage.args.getNames();
	const nameFilter = charName ?? name ?? "";
	const hasNameFilter = nameFilter.length > 0;
	const characters: GameCharacter[] = hasNameFilter
		? characterManager?.filterByName(nameFilter) ?? []
		: characterManager?.slice() ?? [];

	const renderableContent = createAdminRenderableContent(sageMessage.getHasColors());
	renderableContent.append(`## ${entityNamePlural} (${characters.length})`)
	if (hasNameFilter) {
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
					const owner = await toReadableOwner(sageMessage, character.userDid);
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