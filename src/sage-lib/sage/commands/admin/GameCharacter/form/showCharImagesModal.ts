import { registerInteractionListener } from "../../../../../discord/handlers.js";
import type { GameCharacter } from "../../../../model/GameCharacter.js";
import type { SageInteraction } from "../../../../model/SageInteraction.js";
import { createCharModal } from "./createCharModal.js";
import { parseCustomId } from "./customId.js";
import { getCharToEdit } from "./getCharToEdit.js";
import { showCharForm } from "./showCharForm.js";
import type { CustomIdParts } from "./types.js";

export type CharImagesForm = {
	avatarUrl?: string;
	tokenUrl?: string;
};

export function showCharImagesModal(sageInteraction: SageInteraction, char: GameCharacter): Promise<void> {
	const modal = createCharModal({
		userId: sageInteraction.authorDid,
		charId: char.id,
		action: "SubmitImages",
		fields: [
			["tokenUrl", "Character Token Url (left of post)", char.tokenUrl ?? ""],
			["avatarUrl", "Character Avatar Url (embedded in dialog)", char.avatarUrl ?? ""]
		]
	});
	return sageInteraction.interaction.showModal(modal);
}

function isCharImagesSubmit(sageInteraction: SageInteraction): CustomIdParts | undefined {
	const idParts = sageInteraction.parseCustomId(parseCustomId);
	return idParts?.action === "SubmitImages" ? idParts : undefined;
}

async function handleCharImagesSubmit(sageInteraction: SageInteraction, idParts: CustomIdParts): Promise<void> {
	await sageInteraction.replyStack.defer();
	const form = sageInteraction.getModalForm<CharImagesForm>();
	const char = await getCharToEdit(sageInteraction, idParts.charId);
	if (char && form) {
		char.avatarUrl = form.avatarUrl;
		char.tokenUrl = form.tokenUrl;
	}
	return showCharForm(sageInteraction, idParts.charId);
}

export function registerCharImages(): void {
	registerInteractionListener(isCharImagesSubmit, handleCharImagesSubmit);
}