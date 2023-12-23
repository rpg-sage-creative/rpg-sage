import type SageMessage from "../../../model/SageMessage";
import { getCharArgs } from "../common/getCharArgs";
import { getPartyArgs } from "../common/getPartyArgs";
import { shareJoins } from "../common/shareJoins";

export async function eCmdAdd(sageMessage: SageMessage): Promise<void> {
	const game = sageMessage.game;
	if (!game) {
		return sageMessage.denyByProv("Encounter Add", "Encounter commands not allowed outside a Game.");
	}

	if (!sageMessage.canAdminGame) {
		return sageMessage.denyForCanAdminGame("Encounter Add");
	}

	const encounterName = sageMessage.args.removeAndReturnName();
	const encounter = encounterName ? game.encounters.get(encounterName) : null;
	const charArgs = getCharArgs(sageMessage);
	const parties = getPartyArgs(sageMessage);
	if (!encounterName || !encounter || !(charArgs.length || parties.length)) {
		const details: string[] = [];
		if (!encounterName) {
			details.push("Missing Encounter name.");
			details.push("> Please include `name=\"ENCOUNTER NAME\"` in your command.");
		}else if (!encounter) {
			details.push("Invalid Encounter name.");
			details.push(`> A encounter by the name "${encounterName}" cannot be found.`);
		}
		if (!charArgs.length && !parties.length) {
			details.push("Please include at least one PC, NPC, or Party.");
			details.push("> Add PCs using `pc=\"CHAR NAME\"`");
			details.push("> Add NPCs using `npc=\"CHAR NAME\"`");
			details.push("> Add Duplicate NPCs using `npc=\"CHAR NAME\" count=\"2\"`");
			details.push("> Add Nicknamed NPCs using `npc=\"CHAR NAME\" as=\"NICKNAME\"`");
			details.push("> Add Parties using `party=\"PARTY NAME\"`");
		}
		return sageMessage.reactFailure("Unable to add Encounter Character(s).\n" + details.join("\n"));
	}

	const addedChars = encounter.addChars(charArgs);
	if (!addedChars.length) {
		return sageMessage.reactWarn("Sorry, something went wrong adding characters.");
	}

	const addedParties = encounter.addParty(...parties);
	if (!addedParties.length) {
		return sageMessage.reactWarn("Sorry, something went wrong adding parties.");
	}

	const saved = await game.save();
	if (!saved) {
		return sageMessage.reactWarn("Sorry, something went wrong saving game.");
	}

	await shareJoins(encounter, addedChars.concat(addedParties));
	await encounter.updatePins();
}