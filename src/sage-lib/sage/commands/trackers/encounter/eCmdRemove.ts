import type { SageMessage } from "../../../model/SageMessage";
import { getCharArgs } from "../common/getCharArgs";
import { shareLeaves } from "../common/shareLeaves";

export async function eCmdRemove(sageMessage: SageMessage): Promise<void> {
	const cmdLabel = "Encounter: Remove Character";

	const game = sageMessage.game;
	if (!game) {
		await sageMessage.denyByProv(cmdLabel, "Encounter commands not allowed outside a Game.");
		return;
	}

	if (!sageMessage.canAdminGame) {
		await sageMessage.denyForCanAdminGame(cmdLabel);
		return;
	}

	const encounterName = sageMessage.args.removeAndReturnName();
	const encounter = encounterName ? game.encounters.getOrOnly(encounterName) : game.encounters.only;
	const charArgs = getCharArgs(sageMessage).filter(charArg => encounter?.hasChar(charArg.nickname));
	if (!encounter || !charArgs.length) {
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
		await sageMessage.reactFailure("Unable to remove Encounter Character(s).\n" + details.join("\n"));
		return;
	}

	const chars = charArgs.map(charArg => encounter.getCharShell(charArg.nickname)!);

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
	await sageMessage.reactSuccess();
}