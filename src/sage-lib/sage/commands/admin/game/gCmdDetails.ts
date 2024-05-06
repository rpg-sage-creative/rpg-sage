import type { SageCommand } from "../../../model/SageCommand.js";
import { gBlockBots } from "./gBlockBots.js";
import { gFixPerms } from "./gFixPerms.js";
import { gPruneOrphans } from "./gPruneOrphans.js";
import { gReplyDetails, gSendDetails } from "./gSendDetails.js";

export async function gCmdDetails(sageCommand: SageCommand): Promise<void> {
	await gReplyDetails(sageCommand);
	const pruned = await gPruneOrphans(sageCommand);
	const fixed = await gFixPerms(sageCommand);
	const blocked = await gBlockBots(sageCommand);
	if (pruned || fixed || blocked) {
		await gSendDetails(sageCommand);
	}
}
