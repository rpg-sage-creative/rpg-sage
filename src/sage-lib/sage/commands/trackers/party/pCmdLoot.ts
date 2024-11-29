import type { SageMessage } from "../../../model/SageMessage";

export async function pCmdLoot(sageMessage: SageMessage): Promise<void> {
	const game = sageMessage.game;
	if (!game) {
		return sageMessage.denyByProv("Party Loot", "Party commands not allowed outside a Game.");
	}

	if (!sageMessage.canAdminGame && !sageMessage.playerCharacter) {
		return sageMessage.denyForGame("Party Loot");
	}

	const partyName = sageMessage.args.getString("name");
	const party = game.parties.getOrDefault(partyName);
	await sageMessage.sendPost(party.renderLoot());
}