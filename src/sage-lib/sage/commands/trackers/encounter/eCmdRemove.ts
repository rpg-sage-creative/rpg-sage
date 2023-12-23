import type SageMessage from "../../../model/SageMessage";
import { shareLeaves } from "../common/shareLeaves";

export async function eCmdRemove(sageMessage: SageMessage): Promise<void> {
	const game = sageMessage.game;
	if (!game) {
		await sageMessage.denyByProv("Encounter Remove", "Encounter commands not allowed outside a Game.");
		return;
	}

	if (!sageMessage.canAdminGame) {
		await sageMessage.denyForCanAdminGame("Encounter Remove");
		return;
	}

	const encounterName = sageMessage.args.removeAndReturnName();
	const encounter = encounterName ? game.encounters.get(encounterName) : null;
	const charArgs = sageMessage.args.keyValuePairs()
		.filter(kvp => kvp.value && ["pc", "npc", "as", "nick"].includes(kvp.key.toLowerCase()) && encounter?.hasChar(kvp.value));
	if (!encounterName || !encounter || !charArgs.length) {
		const details: string[] = [];
		if (!encounterName) {
			details.push("Missing Encounter name.");
			details.push("> Please include `name=\"ENCOUNTER NAME\"` in your command.");
		} else if (!encounter) {
			details.push("Invalid Encounter name.");
			details.push(`> A encounter by the name "${encounterName}" cannot be found.`);
		}
		if (!charArgs.length) {
			details.push("Please include at least one valid PC or NPC.");
			details.push("> Remove PCs using `pc=\"CHAR NAME\"`");
			details.push("> Remove NPCs using `npc=\"CHAR NAME / NICKNAME\"`");
		}
		await sageMessage.deny("Encounter Add", "Unable to remove Encounter Character(s).", details.join("\n"));
		return;
	}

	const chars = charArgs.map(charArg => encounter.getCharPair(charArg.value!)!);

	let changes = false;
	chars.forEach(char => changes = encounter.removeChar(char.id) || changes);
	if (changes) {
		changes = await sageMessage.game.save();
	}
	if (!changes) {
		await sageMessage.reactWarn("Sorry, something went wrong removing characters.");
		return;
	}

	await shareLeaves(encounter, chars);
	await encounter.updatePins();
}