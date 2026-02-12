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
		const lower = value.toLowerCase();
		if (lower.includes("ignore")) {
			return DiceSecretMethodType.Ignore;
		}
		if (lower.includes("hide")) {
			return DiceSecretMethodType.Hide;
		}
		if (lower.includes("gm") || lower.includes("gamemasterchannel")) {
			return DiceSecretMethodType.GameMasterChannel;
		}
		if (lower.includes("dm") || lower.includes("gamemasterdirect")) {
			return DiceSecretMethodType.GameMasterDirect;
		}
		// if (lower.includes("thread") || lower.includes("gamemasterthread")) {
		// 	return DiceSecretMethodType.GameMasterThread;
		// }
	}
	return undefined;
}
