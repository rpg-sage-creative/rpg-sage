import type { SageCommand } from "../../../model/SageCommand.js";
import { gPruneUsers } from "./gPruneUsers.js";
import { gSendDetails } from "./gSendDetails.js";

export async function gCmdDetails(sageCommand: SageCommand): Promise<void> {
	await gSendDetails(sageCommand);
	await gPruneUsers(sageCommand);
}
