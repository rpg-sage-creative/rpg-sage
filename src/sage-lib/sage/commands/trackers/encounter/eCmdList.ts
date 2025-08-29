import type { SageMessage } from "../../../model/SageMessage.js";

export async function eCmdList(sageMessage: SageMessage): Promise<void> {
	const game = sageMessage.game;
	if (!game) {
		return sageMessage.denyByProv("Encounter List", "Encounter commands not allowed outside a Game.");
	}

	if (!await sageMessage.validatePermission("canManageGame")) {
		return sageMessage.denyForCanAdminGame("Encounter List");
	}

	// render list
	const encounterList: string[] = [];
	const encounters = game.encounters.all;
	for (const encounter of encounters) {
		const charNames: string[] = [];
		const characters = encounter.getSortedCharacters();
		for (const char of characters) {
			const readableOwner = await sageMessage.fetchReadableUser(char.userId);
			const userText = readableOwner ? ` (${readableOwner})` : "";
			charNames.push(`\n- ${char.name} ${userText}`);
		}
		if (!charNames.length) {
			charNames.push(`\n*empty encounter*`);
		}
		encounterList.push(`### ${encounter.name}${charNames.join("")}`);
	}
	if (!encounterList.length) {
		encounterList.push(`*no encounters*`);
	}
	await sageMessage.sendPost(encounterList.join("\n"));

}