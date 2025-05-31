import { NIL_SNOWFLAKE } from "@rsc-utils/core-utils";
import { parseKeyValueArgs } from "@rsc-utils/string-utils";
import { registerInteractionListener } from "../../../../../discord/handlers.js";
import type { GameCharacter } from "../../../../model/GameCharacter.js";
import type { SageInteraction } from "../../../../model/SageInteraction.js";
import { createCharModal } from "./createCharModal.js";
import { parseCustomId } from "./customId.js";
import { getCharToEdit } from "./getCharToEdit.js";
import { showCharForm } from "./showCharForm.js";
import type { CustomIdParts } from "./types.js";

export type CharStatsForm = {
	conditions: string;
	hp: string;
	level: string;
	maxHp: string;
	other: string;
};

export function showCharStatsModal(sageInteraction: SageInteraction, char: GameCharacter): Promise<void> {
	const regex = /^(level|hp|maxhp|conditions)$/i;
	const stats = char.notes.getStats()
		.filter(stat => !regex.test(stat.title))
		.map(stat => `${stat.title}="${stat.note}"`)
		.join("\n");
	const modal = createCharModal({
		userId: sageInteraction.actorId,
		charId: char.isCompanionOrMinion ? char.parentId ?? NIL_SNOWFLAKE : char.id,
		compId: char.isCompanionOrMinion ? char.id : NIL_SNOWFLAKE,
		action: "SubmitStats",
		fields: [
			["level", "Character Level", char.getStat("level") ?? ""],
			["hp", "Current Hit Points", char.getStat("hp") ?? ""],
			["maxHp", "Max Hit Points", char.getStat("maxHp") ?? ""],
			["conditions", "Conditions, ex: prone, stunned 1, dying", char.getStat("conditions") ?? ""],
			["other", `Other Stats (as key="value" pairs)`, stats, "P"],
		]
	});
	return sageInteraction.interaction.showModal(modal);
}

function isCharStatsSubmit(sageInteraction: SageInteraction): CustomIdParts | undefined {
	const idParts = sageInteraction.parseCustomId(parseCustomId);
	return idParts?.action === "SubmitNames" ? idParts : undefined;
}

async function handleCharStatsSubmit(sageInteraction: SageInteraction, idParts: CustomIdParts): Promise<void> {
	await sageInteraction.replyStack.defer();
	const form = sageInteraction.getModalForm<CharStatsForm>();
	const char = await getCharToEdit(sageInteraction, idParts.charId);
	if (char && form) {
		const pairs = [
			{ key:"level", value:form.level },
			{ key:"hp", value:form.hp },
			{ key:"maxHp", value:form.maxHp },
			{ key:"conditions", value:form.conditions },
			...parseKeyValueArgs(form.other.replace(/\n/g, " "))
		];
		await char.updateStats(pairs, false);
	}
	return showCharForm(sageInteraction, idParts.charId);
}

export function registerCharStats(): void {
	registerInteractionListener(isCharStatsSubmit, handleCharStatsSubmit);
}