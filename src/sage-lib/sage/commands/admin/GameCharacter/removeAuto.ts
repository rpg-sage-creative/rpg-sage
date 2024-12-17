import type { Snowflake } from "@rsc-utils/core-utils";
import type { SageCommand } from "../../../model/SageCommand.js";

type Options = {
	userId: Snowflake;
	channelIds: Snowflake[];
};

export async function removeAuto(sageCommand: SageCommand, options: Options): Promise<void> {
	const { game, sageUser } = sageCommand;
	const userDid = options.userId;
	for (const channelDid of options.channelIds) {
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