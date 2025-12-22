import type { Optional } from "@rsc-utils/core-utils";

/** How should we handle secret dice rolls. */
export enum DiceSecretMethodType
{
	/** do nothing, don't look for secret dice */
	Ignore = 0,

	/** use markup/markdown spoiler tags for results */
	Hide = 1,

	/** send dice results to a gm channel; or a gm via dm if a gm channel doesn't exist */
	GameMasterChannel = 2,

	/** send dice results to a gm via dm */
	GameMasterDirect = 3,

	// GameMasterThread = 4
}

export function parseDiceSecretMethodType(value: Optional<string>): DiceSecretMethodType | undefined {
	if (value) {
		if (/Ignore/i.test(value)) {
			return DiceSecretMethodType.Ignore;
		}
		if (/Hide/i.test(value)) {
			return DiceSecretMethodType.Hide;
		}
		if (/gm|GameMasterChannel/i.test(value)) {
			return DiceSecretMethodType.GameMasterChannel;
		}
		if (/dm|GameMasterDirect/i.test(value)) {
			return DiceSecretMethodType.GameMasterDirect;
		}
		// if (/thread|GameMasterThread/i.test(value)) {
		// 	return DiceSecretMethodType.GameMasterThread;
		// }
	}
	return undefined;
}
