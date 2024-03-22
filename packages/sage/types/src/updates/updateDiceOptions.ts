import { isDefined } from "@rsc-utils/type-utils";
import type { DiceOptions } from "../SageChannel.js";

export type OldDiceOptions = DiceOptions & {
	/** @deprecated */
	defaultCritMethodType?: number;
	/** @deprecated */
	defaultDiceOutputType?: number;
	/** @deprecated */
	defaultDicePostType?: number;
	/** @deprecated */
	defaultDiceSecretMethodType?: number;
};

export function updateDiceOptions(options: OldDiceOptions): void {
	if (isDefined(options.defaultCritMethodType)) {
		options.diceCritMethodType = options.defaultCritMethodType;
		delete options.defaultCritMethodType;
	}

	if (isDefined(options.defaultDiceOutputType)) {
		options.diceOutputType = options.defaultDiceOutputType;
		delete options.defaultDiceOutputType;
	}

	if (isDefined(options.defaultDicePostType)) {
		options.dicePostType = options.defaultDicePostType;
		delete options.defaultDicePostType;
	}

	if (isDefined(options.defaultDiceSecretMethodType)) {
		options.diceSecretMethodType = options.defaultDiceSecretMethodType;
		delete options.defaultDiceSecretMethodType;
	}
}