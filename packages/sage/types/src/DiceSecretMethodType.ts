import type { Optional } from "@rsc-utils/core-utils";

export enum DiceSecretMethodType {
	Ignore = 0,
	Hide = 1,
	GameMasterChannel = 2,
	GameMasterDirect = 3,
	// GameMasterThread = 4
}

const IgnoreRegExp = /\bIgnore\b/i;
const HideRegExp = /\bHide\b/i;
const GameMasterChannelRegExp = /\b(gm|GameMasterChannel)\b/i;
const GameMasterDirectRegExp = /\b(dm|GameMasterDirect)\b/i;
// const GameMasterThreadRegExp = /\b(thread|GameMasterThread)\b/i;

export function parseDiceSecretMethodType(value: Optional<string>): DiceSecretMethodType | undefined {
	if (value) {
		if (IgnoreRegExp.test(value)) {
			return DiceSecretMethodType.Ignore;
		}
		if (HideRegExp.test(value)) {
			return DiceSecretMethodType.Hide;
		}
		if (GameMasterChannelRegExp.test(value)) {
			return DiceSecretMethodType.GameMasterChannel;
		}
		if (GameMasterDirectRegExp.test(value)) {
			return DiceSecretMethodType.GameMasterDirect;
		}
		// if (GameMasterThreadRegExp.test(value)) {
		// 	return DiceSecretMethodType.GameMasterThread;
		// }
	}
	return undefined;
}
