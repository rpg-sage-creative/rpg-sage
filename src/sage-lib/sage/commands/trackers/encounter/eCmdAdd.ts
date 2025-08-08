import { CharacterShell } from "../../../model/CharacterShell.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { getCharArgs } from "../common/getCharArgs.js";
import { getPartyArgs } from "../common/getPartyArgs.js";
import { shareJoins } from "../common/shareJoins.js";

export async function eCmdAdd(sageMessage: SageMessage): Promise<void> {
	const cmdLabel = "Encounter: Add Character";

	const game = sageMessage.game;
	if (!game) {
		return sageMessage.denyByProv(cmdLabel, "Encounter commands not allowed outside a Game.");
	}

	if (!await sageMessage.validatePermission("canManageGame")) {
		return sageMessage.denyForCanAdminGame(cmdLabel);
	}

	const encounterName = sageMessage.args.getString("name");
	const encounter = encounterName ? game.encounters.getOrOnly(encounterName) : game.encounters.only;
	const charArgs = getCharArgs(sageMessage);
	const parties = getPartyArgs(sageMessage);
	if (!encounter || !(charArgs.length || parties.length)) {
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

	const added: CharacterShell[] = [];

	if (charArgs.length) {
		const addedChars = encounter.addChars(charArgs);
		if (!addedChars.length) {
			return sageMessage.reactWarn("Sorry, something went wrong adding characters.");
		}
		added.push(...addedChars);
	}

	if (parties.length) {
		const addedChars = encounter.addParty(...parties);
		if (!addedChars.length) {
			return sageMessage.reactWarn("Sorry, something went wrong adding parties.");
		}
	}

	const saved = await game.save();
	if (!saved) {
		return sageMessage.reactWarn("Sorry, something went wrong saving game.");
	}

	await shareJoins(encounter, added);
	await encounter.updatePins();
	await sageMessage.reactSuccess();
}