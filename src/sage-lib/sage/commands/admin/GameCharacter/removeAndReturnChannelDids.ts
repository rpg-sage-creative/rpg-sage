import type { Snowflake } from "discord.js";
import type SageMessage from "../../../model/SageMessage";

export async function removeAndReturnChannelDids(sageMessage: SageMessage): Promise<Snowflake[]> {
	const channelDids = <Snowflake[]>[];
	let channelDid: Snowflake | null;
	do {
		channelDid = await sageMessage.args.removeAndReturnChannelDid();
		if (channelDid) {
			channelDids.push(channelDid);
		}
	} while (channelDid);
	if (!channelDids.length && sageMessage.channelDid) {
		channelDids.push(sageMessage.channelDid);
	}
	return channelDids;
}