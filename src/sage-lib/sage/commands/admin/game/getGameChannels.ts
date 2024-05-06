import { SageChannelType, type SageChannel } from "@rsc-sage/types";
import type { SageCommand } from "../../../model/SageCommand.js";
import { DiscordKey, toChannelMention } from "@rsc-utils/discord-utils";

type Results = { free:SageChannel[]; used:SageChannel[]; };

export async function getGameChannels(sageCommand: SageCommand, includeThisChannel: boolean): Promise<Results> {
	const channels: SageChannel[] = [];

	const icIds = sageCommand.args.getChannelIds("ic");
	icIds.forEach(id => channels.push({ id, type:SageChannelType.InCharacter }));

	const oocIds = sageCommand.args.getChannelIds("ooc");
	oocIds.forEach(id => channels.push({ id, type:SageChannelType.OutOfCharacter }));

	const gmIds = sageCommand.args.getChannelIds("gm");
	gmIds.forEach(id => channels.push({ id, type:SageChannelType.GameMaster }));

	const diceIds = sageCommand.args.getChannelIds("dice");
	diceIds.forEach(id => channels.push({ id, type:SageChannelType.Dice }));

	const miscIds = sageCommand.args.getChannelIds("misc");
	miscIds.forEach(id => channels.push({ id, type:SageChannelType.Miscellaneous }));

	if (!channels.length && includeThisChannel && sageCommand.channelDid) {
		channels.push({ id:sageCommand.channelDid, type:SageChannelType.OutOfCharacter });
	}

	const free: SageChannel[] = [];
	const used: SageChannel[] = [];
	for (const channel of channels) {
		const discordKey = new DiscordKey(sageCommand.server.did, channel.id);
		const otherGame = await sageCommand.sageCache.games.findActiveByDiscordKey(discordKey);
		if (otherGame) {
			used.push(channel);
		}else {
			free.push(channel);
		}
	}

	if (used.length) {
		const channelLinks = used.map(channel => "\n- " + toChannelMention(channel.id));
		const channelist = channelLinks.join("");
		await sageCommand.whisper(`The following channels are already part of an active game:` + channelist);
	}

	return { free, used };
}