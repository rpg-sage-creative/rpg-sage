import type { SageMessage } from "../../../model/SageMessage.js";

export async function pCmdList(sageMessage: SageMessage): Promise<void> {
	const game = sageMessage.game;
	if (!game) {
		return sageMessage.denyByProv("Party List", "Party commands not allowed outside a Game.");
	}

	if (!await sageMessage.validatePermission("canManageGame")) {
		return sageMessage.denyForCanAdminGame("Party List");
	}

	const parties = game.parties.all;
	if (!parties.length) {
		parties.push(game.parties.getDefault());
	}

	// render list
	const partyList: string[] = [];
	for (const party of parties) {
		const charNames: string[] = [];
		const characters = party.getSortedCharacters();
		for (const char of characters) {
			const userName = await sageMessage.fetchReadableUser(char.userId);
			const userText = userName ? ` (${userName})` : "";
			charNames.push(`\n- ${char.name} ${userText}`);
		}
		if (!charNames.length) {
			charNames.push(`\n*empty party*`);
		}
		partyList.push(`### ${party.name}${charNames.join("")}`);
	}
	await sageMessage.sendPost(partyList.join("\n"));

}