import type { SageMessage } from "../../../model/SageMessage.js";

export async function eCmdDelete(sageMessage: SageMessage): Promise<void> {
	const game = sageMessage.game;
	if (!game) {
		await sageMessage.denyByProv("Delete Encounter", "Encounter commands not allowed outside a Game.");
		return;
	}

	if (!sageMessage.canAdminGame) {
		await sageMessage.denyForCanAdminGame("Delete Encounter");
		return;
	}

	const encounterName = sageMessage.args.getString("name");
	const encounter = encounterName ? game.encounters.get(encounterName) : null;
	if (!encounter) {
		await sageMessage.reactFailure(`Unable to delete Encounter. A Encounter by the name "${encounterName}" doesn't exists.`);
	} else {
		const removed = game.encounters.remove(encounter.id);
		const saved = removed ? await sageMessage.game.save() : false;
		if (saved) {
			const unpinned = await encounter.unpin();
			if (!unpinned) {
				await sageMessage.whisper(`Error unpinning encounter "${encounter.name}", you may have to do it manually.`);
			}
			await sageMessage.reactSuccess(`Encounter "${encounter.name}" removed.`);
		} else {
			await sageMessage.reactFailure("Unable to delete Encounter. Don't know what happened, sorry!");
		}
	}

}