import type { Optional } from "@rsc-utils/type-utils";

export enum DiceSecretMethodType {
	Ignore = 0,
	Hide = 1,
	GameMasterChannel = 2,
	GameMasterDirect = 3,
	// GameMasterThread = 4
}

export function parseDiceSecretMethodType(value: Optional<string>): DiceSecretMethodType | undefined {
	if (value) {
		if (/ignore/i.test(value)) {
			return DiceSecretMethodType.Ignore;
		}
		if (/hide/i.test(value)) {
			return DiceSecretMethodType.Hide;
		}
		if (/gm/i.test(value)) {
			return DiceSecretMethodType.GameMasterChannel;
		}
		if (/dm/i.test(value)) {
			return DiceSecretMethodType.GameMasterDirect;
		}
		// if (/thread/i.test(value)) {
		// 	return DiceSecretMethodType.GameMasterThread;
		// }
	}
	return undefined;
}
