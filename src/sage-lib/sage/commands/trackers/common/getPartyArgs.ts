import { isDefined } from "@rsc-utils/core-utils";
import type { SageMessage } from "../../../model/SageMessage.js";
import type { Party } from "../party/Party.js";

export function getPartyArgs(sageMessage: SageMessage): Party[] {
	const { game } = sageMessage;
	if (!game) {
		return [];
	}

	return sageMessage.args.manager.keyValueArgs()
		.filter(arg => arg.keyLower === "party")
		.map(arg => game.parties.get(arg.value))
		.filter(isDefined);
}