import type { GameOptions } from "@rsc-sage/types";
import type { Server } from "../../../model/Server.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { applyChanges } from "@rsc-utils/json-utils";

function getServerValues(server: Server): Partial<GameOptions> {
	const { dialogPostType, diceCritMethodType, diceOutputType, dicePostType, diceSecretMethodType, gameSystemType, gmCharacterName } = server;
	return { dialogPostType, diceCritMethodType, diceOutputType, dicePostType, diceSecretMethodType, gameSystemType, gmCharacterName };
}

/** Returns GameOptions by applying args to the values from the Server. */
export function getGameValues(sageCommand: SageCommand): Partial<GameOptions> {
	// get base/defaults
	const options = getServerValues(sageCommand.server);

	// get argument values
	const argOptions = sageCommand.args.getGameOptions() ?? {};

	// apply argument values to defaults
	applyChanges(options, argOptions);

	// return final options
	return options;
}