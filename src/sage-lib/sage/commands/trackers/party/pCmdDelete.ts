import type SageMessage from "../../../model/SageMessage";

export async function pCmdDelete(sageMessage: SageMessage): Promise<void> {
	const game = sageMessage.game;
	if (!game) {
		await sageMessage.denyByProv("Delete Party", "Party commands not allowed outside a Game.");
		return;
	}

	if (!sageMessage.canAdminGame) {
		await sageMessage.denyForCanAdminGame("Delete Party");
		return;
	}

	const partyName = sageMessage.args.removeAndReturnName();
	const party = partyName ? game.parties.get(partyName) : null;
	if (!party) {
		await sageMessage.reactFailure(`Unable to delete Party. A Party by the name "${partyName}" doesn't exists.`);
	} else {
		const removed = game.parties.remove(party.id);
		const saved = removed ? await sageMessage.game.save() : false;
		if (saved) {
			const unpinned = await party.unpin();
			if (!unpinned) {
				await sageMessage.whisper(`Error unpinning party "${party.name}", you may have to do it manually.`);
			}
			await sageMessage.reactSuccess(`Party "${party.name} removed.`);
		} else {
			await sageMessage.reactFailure("Unable to delete Party. Don't know what happened, sorry!");
		}
	}
}