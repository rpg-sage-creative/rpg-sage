import { exists } from "../../../../../sage-utils/utils/ArrayUtils/Filters";
import type SageMessage from "../../../model/SageMessage";
import type { Party } from "../party/Party";

export function getPartyArgs(sageMessage: SageMessage): Party[] {
	const { game } = sageMessage;
	if (!game) {
		return [];
	}

	const keyRegex = /^party$/i;
	return sageMessage.args.keyValuePairs()
		.filter(kvp => keyRegex.test(kvp.key))
		.map(kvp => game.parties.get(kvp.value))
		.filter(exists);
}