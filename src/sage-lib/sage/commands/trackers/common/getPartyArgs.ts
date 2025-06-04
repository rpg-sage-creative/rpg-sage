import { isDefined } from "@rsc-utils/core-utils";
import type { SageMessage } from "../../../model/SageMessage.js";
import type { Party } from "../party/Party.js";

export function getPartyArgs(sageMessage: SageMessage): Party[] {
	const { game } = sageMessage;
	if (!game) {
		return [];
	}

	return sageMessage.args.manager.keyValueArgs("party")
		.map(kvp => game.parties.get(kvp.value))
		.filter(isDefined) as Party[];
}