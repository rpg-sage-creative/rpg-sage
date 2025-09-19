import { SageChannelType, type SageChannel } from "@rsc-sage/types";
import type { Snowflake } from "@rsc-utils/core-utils";
import { toChannelMention } from "@rsc-utils/discord-utils";
import type { SageCommand } from "../../../model/SageCommand.js";

type Results = { free:SageChannel[]; used:SageChannel[]; };

function getChannelIds({ args }: SageCommand, name: string): Snowflake[] {
	const ids: Snowflake[] = [];
	ids.push(...args.getChannelIds(`${name}-channel`));
	ids.push(...args.getChannelIds(`${name}`));
	if (name.includes("-")) {
		ids.push(...args.getChannelIds(`${name.replace("-", "")}`));
	}
	return ids;
}

export async function getGameChannels(sageCommand: SageCommand, includeThisChannel: boolean): Promise<Results> {
	const channels: SageChannel[] = [];

	const autoIcIds = getChannelIds(sageCommand, "auto-ic");
	autoIcIds.forEach(id => channels.push({ id, type:SageChannelType.AutoInCharacter }));

	const icIds = getChannelIds(sageCommand, "ic");
	icIds.forEach(id => channels.push({ id, type:SageChannelType.InCharacter }));

	const oocIds = getChannelIds(sageCommand, "ooc");
	oocIds.forEach(id => channels.push({ id, type:SageChannelType.OutOfCharacter }));

	const gmIds = getChannelIds(sageCommand, "gm");
	gmIds.forEach(id => channels.push({ id, type:SageChannelType.GameMaster }));

	const autoDiceIds = getChannelIds(sageCommand, "auto-dice");
	autoDiceIds.forEach(id => channels.push({ id, type:SageChannelType.AutoDice }));

	const diceIds = getChannelIds(sageCommand, "dice");
	diceIds.forEach(id => channels.push({ id, type:SageChannelType.Dice }));

	const miscIds = getChannelIds(sageCommand, "misc");
	miscIds.forEach(id => channels.push({ id, type:SageChannelType.Miscellaneous }));

	if (!channels.length && includeThisChannel) {
		const { dChannel } = sageCommand;
		if (dChannel) {
			channels.push({ id:dChannel.id as Snowflake, type:SageChannelType.OutOfCharacter });
		}
	}

	const free: SageChannel[] = [];
	const used: SageChannel[] = [];
	for (const channel of channels) {
		const otherGame = await sageCommand.server?.findActiveGame(channel.id);
		if (otherGame) {
			used.push(channel);
		}else {
			free.push(channel);
		}
	}

	if (used.length) {
		const channelLinks = used.map(channel => "\n- " + toChannelMention(channel.id));
		const channelist = channelLinks.join("");
		await sageCommand.replyStack.whisper(`The following channels are already part of an active game:` + channelist);
	}

	return { free, used };
}