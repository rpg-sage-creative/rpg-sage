import type { SageCommand } from "../../../model/SageCommand.js";
import { gFixPerms } from "./gFixPerms.js";
import { gPruneOrphans } from "./gPruneOrphans.js";
import { gReplyDetails } from "./gSendDetails.js";

export async function gCmdDetails(sageCommand: SageCommand): Promise<void> {
	await gReplyDetails(sageCommand);
	await gPruneOrphans(sageCommand);
	await gFixPerms(sageCommand);
}
