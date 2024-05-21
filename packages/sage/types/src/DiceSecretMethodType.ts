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
