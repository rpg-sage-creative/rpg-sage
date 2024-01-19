import type { Snowflake } from "discord.js";
import type { GameCharacter } from "../../../model/GameCharacter";
import type { SageMessage } from "../../../model/SageMessage";

export async function removeAuto(sageMessage: SageMessage, ...channelDids: Snowflake[]): Promise<void> {
	const { game, sageUser } = sageMessage;
	const hasCharacters = game ?? sageUser;
	const userDid = sageUser.did;
	for (const channelDid of channelDids) {
		let char: GameCharacter | undefined;
		while (char = hasCharacters.getAutoCharacterForChannel(userDid, channelDid)) {
			await char.removeAutoChannel({ channelDid, userDid });
		}
	}
}