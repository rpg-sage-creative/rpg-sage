import type { SageMessage } from "../../../model/SageMessage";
import { shareLeaves } from "../common/shareLeaves";

export async function pCmdRemove(sageMessage: SageMessage): Promise<void> {
	const game = sageMessage.game;
	if (!game) {
		await sageMessage.denyByProv("Party Remove", "Party commands not allowed outside a Game.");
		return;
	}

	if (!sageMessage.canAdminGame) {
		await sageMessage.denyForCanAdminGame("Party Remove");
		return;
	}

	const partyName = sageMessage.args.removeAndReturnName();
	const party = partyName ? game.parties.get(partyName) : null;
	const charArgs = sageMessage.args.keyValuePairs()
		.filter(kvp => kvp.value && ["pc", "npc", "as", "nick"].includes(kvp.key.toLowerCase()) && party?.hasChar(kvp.value));
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
			details.push("Please include at least one valid PC or NPC.");
			details.push("> Remove PCs using `pc=\"CHAR NAME\"`");
			details.push("> Remove NPCs using `npc=\"CHAR NAME / NICKNAME\"`");
		}
		await sageMessage.deny("Party Add", "Unable to remove Party Character(s).", details.join("\n"));
		return;
	}

	const chars = charArgs.map(charArg => party.getCharShell(charArg.value!)!);

	let changes = false;
	chars.forEach(char => changes = party.removeChar(char.id) || changes);
	if (changes) {
		changes = await sageMessage.game.save();
	}
	if (!changes) {
		await sageMessage.reactWarn("Sorry, something went wrong removing characters.");
		return;
	}

	await shareLeaves(party, chars);
	await party.updatePins();
}