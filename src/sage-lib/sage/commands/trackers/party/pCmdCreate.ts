import type SageMessage from "../../../model/SageMessage";
import { getCharArgs } from "../common/getCharArgs";
import { shareJoins } from "../common/shareJoins";

export async function pCmdCreate(sageMessage: SageMessage): Promise<void> {
	const game = sageMessage.game;
	if (!game) {
		return sageMessage.denyByProv("Create Party", "Party commands not allowed outside a Game.");
	}

	if (!sageMessage.canAdminGame) {
		return sageMessage.denyForCanAdminGame("Create Party");
	}

	const partyName = sageMessage.args.removeAndReturnName();
	const existingParty = partyName ? game.parties.get(partyName) : null;
	const charArgs = getCharArgs(sageMessage);
	if (!partyName || existingParty) {
		const details: string[] = [];
		if (!partyName) {
			details.push("Missing Party name.");
			details.push("> Please include `name=\"PARTY NAME\"` in your command.");
		} else if (existingParty) {
			details.push("Invalid Party name.");
			details.push(`> A party by the name "${partyName}" already exists.`);
		}
		if (!charArgs.length) {
			details.push("You may also include PCs or NPCs.");
			details.push("> Add PCs using `pc=\"CHAR NAME\"`");
			details.push("> Add NPCs using `npc=\"CHAR NAME\"");
			details.push("> Add Duplicate NPCs using `npc=\"CHAR NAME\" count=\"2\"`");
			details.push("> Add Nicknamed NPCs using `npc=\"CHAR NAME\" as=\"NICKNAME\"`");
		}
		return sageMessage.reactFailure("Unable to create Party.\n" + details.join("\n"));
	}

	const party = game.parties.add(partyName);
	if (!party) {
		return sageMessage.reactFailure("Unable to create Party. Don't know what happened, sorry!");
	}

	const addedChars = party.addChars(charArgs);
	if (charArgs.length && !addedChars.length) {
		return sageMessage.reactWarn("Sorry, something went wrong adding characters.");
	}

	const saved = await game.save();
	if (!saved) {
		return sageMessage.reactWarn("Sorry, something went wrong saving game.");
	}

	await sageMessage.sendPost(`*Party "${partyName}" formed*`);
	await shareJoins(party, addedChars);
	await sageMessage.sendPost(party.renderStatus());
}