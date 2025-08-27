import { debug } from "@rsc-utils/core-utils";
import { registerInteractionListener } from "../../../../discord/handlers.js";
import type { SageButtonInteraction } from "../../../model/SageInteraction.js";

// return `encounter-${encounter.id}-status-action-${action}`;
function isEncounterStartStopButton(sageInteraction: SageButtonInteraction): boolean {
	const regex = /encounter-\d+-status-action-(start|stop)/;
	return regex.test(sageInteraction.interaction.customId);
}

async function handleEncounterStartStopButton(sageInteraction: SageButtonInteraction): Promise<void> {
	sageInteraction.replyStack.defer();
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