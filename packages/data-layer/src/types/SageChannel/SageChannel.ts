import type { Snowflake } from "@rsc-utils/core-utils";
import { DialogOptionsV1Keys, type DialogOptions } from "../DialogOptions/DialogOptions.js";
import { DiceOptionsV1Keys, type DiceOptions } from "../DiceOptions/DiceOptions.js";
import { GameSystemOptionsV1Keys, type GameSystemOptions } from "../GameSystemOptions/GameSystemOptions.js";
import { ChannelOptionsV1Keys, type ChannelOptions } from "../options/ChannelOptions.js";

export type SageChannelOptions = DialogOptions & DiceOptions & GameSystemOptions & ChannelOptions;

export type SageChannelOld = SageChannelV0;
export type SageChannel = SageChannelV1;
export type SageChannelAny = SageChannel | SageChannelOld;

export type SageChannelV0 = SageChannelV1 & {
	/** @deprecated */
	did?: Snowflake;

	/** @deprecated */
	nickName?: string;

	/** @deprecated */
	sendCommandTo?: string;

	/** @deprecated */
	sendSearchTo?: string;
};

export type SageChannelV1 = SageChannelOptions & {
	id: Snowflake;
};

export const SageChannelV1Keys: (keyof SageChannelV1)[] = [
	...ChannelOptionsV1Keys,
	...DialogOptionsV1Keys,
	...DiceOptionsV1Keys,
	...GameSystemOptionsV1Keys,
	"id",
];