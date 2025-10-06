import { NIL_SNOWFLAKE } from "@rsc-utils/core-utils";
import { DiscordMaxValues } from "@rsc-utils/discord-utils";
import { registerInteractionListener } from "../../../../../discord/handlers.js";
import type { GameCharacter } from "../../../../model/GameCharacter.js";
import type { SageInteraction } from "../../../../model/SageInteraction.js";
import { createCharModal } from "./createCharModal.js";
import { parseCustomId } from "./customId.js";
import { getCharToEdit } from "./getCharToEdit.js";
import { showCharForm } from "./showCharForm.js";
import type { CustomIdParts } from "./types.js";

export type CharNamesForm = {
	name: string;
	aka?: string;
	alias?: string;
	displayNameTemplate?: string;
};

export function showCharNamesModal(sageInteraction: SageInteraction, char: GameCharacter): Promise<void> {
	const { maxLength } = DiscordMaxValues.webhook.username;
	const modal = createCharModal({
		userId: sageInteraction.actorId,
		charId: char.isCompanionOrMinion ? char.parentId ?? NIL_SNOWFLAKE : char.id,
		compId: char.isCompanionOrMinion ? char.id : NIL_SNOWFLAKE,
		action: "SubmitNames",
		fields: [
			["name", "Character Name", char.name, maxLength, true],
			["aka", "Character Nickname (aka)", char.aka ?? "", maxLength],
			["alias", "Character Alias (used for RPG Sage commands)", char.alias ?? "", maxLength],
			["displayNameTemplate", "Display Name Template", char.getTemplate("displayName") ?? "", maxLength]
		]
	});
	return sageInteraction.interaction.showModal(modal);
}

function isCharNamesSubmit(sageInteraction: SageInteraction): CustomIdParts | undefined {
	const idParts = sageInteraction.parseCustomId(parseCustomId);
	return idParts?.action === "SubmitNames" ? idParts : undefined;
}

async function handleCharNamesSubmit(sageInteraction: SageInteraction, idParts: CustomIdParts): Promise<void> {
	await sageInteraction.replyStack.defer();
	const form = sageInteraction.getModalForm<CharNamesForm>();
	const char = await getCharToEdit(sageInteraction, idParts.charId);
	if (char && form) {
		char.name = form.name;
		char.aka = form.aka;
		char.alias = form.alias;
		char.setTemplate("displayName", form.displayNameTemplate);
	}
	return showCharForm(sageInteraction, idParts.charId);
}

export function registerCharNames(): void {
	registerInteractionListener(isCharNamesSubmit, handleCharNamesSubmit);
}