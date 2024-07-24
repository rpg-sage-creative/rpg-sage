import { debug } from "@rsc-utils/core-utils";
import { ButtonInteraction } from "discord.js";
import { registerInteractionListener } from "../../../../discord/handlers";
import { SageInteraction } from "../../../model/SageInteraction";

// return `encounter-${encounter.id}-status-action-${action}`;
function isEncounterStartStopButton(sageInteraction: SageInteraction<ButtonInteraction>): boolean {
	const regex = /encounter-\d+-status-action-(start|stop)/;
	return regex.test(sageInteraction.interaction.customId);
}

async function handleEncounterStartStopButton(sageInteraction: SageInteraction<ButtonInteraction>): Promise<void> {
	await sageInteraction.defer(false);
	const [_encounter, encounterId, _status, _action, action] = sageInteraction.interaction.customId.split("-")[1];
	const encounter = sageInteraction.game?.encounters.get(encounterId);
	debug({encounterId,encounter:!!encounter});
	if (action === "start") {
		encounter?.start();
	}else {
		encounter?.stop();
	}
	await encounter?.updatePins();
}

export function registerEncounterStartStopButton(): void {
	registerInteractionListener(isEncounterStartStopButton, handleEncounterStartStopButton);
}