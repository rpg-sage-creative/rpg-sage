import type { SageMessage } from "../../../model/SageMessage.js";
import { getCharArgs } from "../common/getCharArgs.js";
import { shareJoins } from "../common/shareJoins.js";

export async function pCmdAdd(sageMessage: SageMessage): Promise<void> {
	const game = sageMessage.game;
	if (!game) {
		return sageMessage.denyByProv("Party Add", "Party commands not allowed outside a Game.");
	}

	if (!sageMessage.canAdminGame) {
		return sageMessage.denyForCanAdminGame("Party Add");
	}

	const partyName = sageMessage.args.getString("name");
	const party = partyName ? game.parties.get(partyName) : null;
	const charArgs = getCharArgs(sageMessage);
	if (!partyName || !party || !charArgs.length) {
		const details: string[] = [];
		if (!partyName) {
			details.push("Missing Party name.");
			details.push("> Please include `name=\"PARTY NAME\"` in your command.");
		} else if (!party) {
			details.push("Invalid Party name.");
			details.push(`> A party by the name "${partyName}" cannot be found.`);
		}
		if (!charArgs.length) {
			details.push("Please include at least one PC or NPC.");
			details.push("> Add PCs using `pc=\"CHAR NAME\"`");
			details.push("> Add NPCs using `npc=\"CHAR NAME\"`");
			details.push("> Add Duplicate NPCs using `npc=\"CHAR NAME\" count=\"2\"`");
			details.push("> Add Nicknamed NPCs using `npc=\"CHAR NAME\" as=\"NICKNAME\"`");
		}
		return sageMessage.reactFailure("Unable to add Party Character(s).\n" + details.join("\n"));
	}

	const added = party.addChars(charArgs);
	if (!added.length) {
		return sageMessage.reactWarn("Sorry, something went wrong adding characters.");
	}

	const saved = await game.save();
	if (!saved) {
		return sageMessage.reactWarn("Sorry, something went wrong saving game.");
	}

	await shareJoins(party, added);
	await party.updatePins();
}