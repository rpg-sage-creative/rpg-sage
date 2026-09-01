import type { Snowflake } from "@rsc-utils/core-utils";
import type { Game } from "../../../model/Game.js";
import type { User } from "../../../model/User.js";

type Args = {
	channelIds: Snowflake[];
	game?: Game;
	sageUser: User;
	userId: Snowflake;
};

export async function removeAuto({ channelIds, game, sageUser, userId }: Args): Promise<void> {
	for (const channelId of channelIds) {
		const autoChannelArg = { channelId, userId };

		const gameChar = game?.getAutoCharacterForChannel(autoChannelArg)?.char;
		if (gameChar) {
			await gameChar.removeAutoChannel(autoChannelArg, false);
		}

		const userChar = sageUser.getAutoCharacterForChannel(autoChannelArg)?.char;
		if (userChar) {
			/** @todo confirm we cleaned up the autochanneldata to always have userid and remove this first call */
			// removes autoChannelData that is missing userId
			await userChar.removeAutoChannel({ channelId }, false);
			// removes autoChannelData that has userId
			await userChar.removeAutoChannel(autoChannelArg, false);
		}
	}
}