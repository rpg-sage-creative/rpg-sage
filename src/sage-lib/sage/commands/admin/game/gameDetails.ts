import type { Game } from "../../../model/Game.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { gPruneUsers } from "./gPruneUsers.js";
import { gSendDetails } from "./gSendDetails.js";

/** @todo split into a "createDetails" and "showDetails" (that allows prune) */
export async function gameDetails(sageCommand: SageCommand, skipPrune = false, _game?: Game): Promise<void> {
	await gSendDetails(sageCommand, _game);
	if (sageCommand.server && !skipPrune) {
		await gPruneUsers(sageCommand);
	}
}
