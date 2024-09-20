import type { Snowflake } from "@rsc-utils/core-utils";
import type { SageMessage } from "../../../model/SageMessage.js";

export async function removeAuto(sageMessage: SageMessage, ...channelDids: Snowflake[]): Promise<void> {
	const { game, sageUser } = sageMessage;
	const userDid = sageUser.did;
	for (const channelDid of channelDids) {
		const gameChar = game?.getAutoCharacterForChannel(userDid, channelDid);
		if (gameChar) {
			await gameChar.removeAutoChannel({ channelDid, userDid }, false);
		}
		const userChar = sageUser.getAutoCharacterForChannel(userDid, channelDid);
		if (userChar) {
			await userChar.removeAutoChannel({ channelDid }, false);
			await userChar.removeAutoChannel({ channelDid, userDid }, false);
		}
	}
}