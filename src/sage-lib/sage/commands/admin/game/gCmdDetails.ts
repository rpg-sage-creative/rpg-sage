import type { SageCommand } from "../../../model/SageCommand.js";
import { gFixPerms } from "./gFixPerms.js";
import { gPruneOrphans } from "./gPruneOrphans.js";
import { gSendDetails } from "./gSendDetails.js";

export async function gCmdDetails(sageCommand: SageCommand): Promise<void> {
	await gSendDetails(sageCommand);
	await gPruneOrphans(sageCommand);
	await gFixPerms(sageCommand);
}
