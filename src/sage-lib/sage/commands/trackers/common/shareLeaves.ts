import { isSupportedGameMessagesChannel } from "@rsc-utils/discord-utils";
import { CharacterShell } from "../../../model/CharacterShell.js";
import type { HasCharacters } from "./HasCharacters.js";

export async function shareLeaves(hasCharacters: HasCharacters<any>, characters: CharacterShell[]): Promise<void> {
	if (characters.length) {
		const game = hasCharacters.game;
		const ic = await game.findBestPlayerChannel();
		const channel = await game.sageCache.fetchChannel(ic?.id);
		if (isSupportedGameMessagesChannel(channel)) {
			const joinedWhat = "setInit" in hasCharacters ? "encounter" : "party";
			const joinedName = joinedWhat === "party" && game.parties.count > 1 ? `"${hasCharacters.name}"` : "";
			const joinedList = characters.map(char => `*${char.name} leaves ${joinedWhat} ${joinedName}*`);
			await channel.send(joinedList.join("\n"));
		}
	}
}