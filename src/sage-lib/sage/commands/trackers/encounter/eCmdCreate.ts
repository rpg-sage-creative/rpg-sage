import type { SageMessage } from "../../../model/SageMessage.js";
import { getCharArgs } from "../common/getCharArgs.js";
import { getPartyArgs } from "../common/getPartyArgs.js";
import { shareJoins } from "../common/shareJoins.js";

export async function eCmdCreate(sageMessage: SageMessage): Promise<void> {
	const game = sageMessage.game;
	if (!game) {
		return sageMessage.denyByProv("Create Encounter", "Encounter commands not allowed outside a Game.");
	}

	if (!await sageMessage.validatePermission("canManageGame")) {
		return sageMessage.denyForCanAdminGame("Create Encounter");
	}

	const encounterName = sageMessage.args.getString("name");
	const existingEncounter = encounterName ? game.encounters.get(encounterName) : null;
	const charArgs = getCharArgs(sageMessage);
	const parties = getPartyArgs(sageMessage);
	if (!encounterName || existingEncounter) {
		const details: string[] = [];
		if (!encounterName) {
			details.push("Missing Encounter name.");
			details.push("> Please include `name=\"ENCOUNTER NAME\"` in your command.");
		} else if (existingEncounter) {
			details.push("Invalid Encounter name.");
			details.push(`> An encounter by the name "${encounterName}" already exists.`);
		}
		if (!charArgs.length && !parties.length) {
			details.push("You may also include PCs or NPCs.");
			details.push("> Add PCs using `pc=\"CHAR NAME\"`");
			details.push("> Add NPCs using `npc=\"CHAR NAME\"");
			details.push("> Add Duplicate NPCs using `npc=\"CHAR NAME\" count=\"2\"`");
			details.push("> Add Nicknamed NPCs using `npc=\"CHAR NAME\" as=\"NICKNAME\"`");
			details.push("> Add Parties using `party=\"PARTY NAME\"`");
		}
		return sageMessage.reactFailure("Unable to create Encounter.\n" + details.join("\n"));
	}

	const encounter = game.encounters.add(encounterName);
	if (!encounter) {
		return sageMessage.reactFailure("Unable to create Encounter. Don't know what happened, sorry!");
	}

	const addedChars = encounter.addChars(charArgs);
	if (charArgs.length && !addedChars.length) {
		return sageMessage.reactWarn("Sorry, something went wrong adding characters.");
	}

	const addedParties = encounter.addParty(...parties);
	if (parties.length && !addedParties.length) {
		return sageMessage.reactWarn("Sorry, something went wrong adding parties.");
	}

	const saved = await game.save();
	if (!saved) {
		return sageMessage.reactWarn("Sorry, something went wrong saving game.");
	}

	await sageMessage.sendPost(`*Encounter "${encounterName}" created*`);
	await shareJoins(encounter, addedChars.concat(addedParties));
	await sageMessage.sendPost(encounter.renderInit());
}