import { isNonNilSnowflake, type Snowflake } from "@rsc-utils/core-utils";
import { assertString, isSimpleObject, renameProperty, type EnsureOptions } from "../validation/index.js";
import { assertChannelOptions, ChannelOptionsV1Keys, ensureChannelOptions, type ChannelOptions } from "./ChannelOptions.js";
import { assertDialogOptions, DialogOptionsKeys, ensureDialogOptions, type DialogOptions } from "./DialogOptions/index.js";
import { assertDiceOptions, DiceOptionsKeys, ensureDiceOptions, type DiceOptions } from "./DiceOptions/index.js";
import { assertGameSystemOptionsV1 } from "./GameSystemOptions/assertGameSystemOptionsV1.js";
import { GameSystemOptionsV1Keys, type GameSystemOptions } from "./GameSystemOptions/GameSystemOptions.js";
import { ensureGameSystemOptionsV1 } from "./GameSystemOptions/index.js";

/** All SageChannel options that can be set by users. */
export type SageChannelOptions = DialogOptions & DiceOptions & GameSystemOptions & ChannelOptions;

export type SageChannelAny = SageChannel | SageChannelOld;

export type SageChannelOld = SageChannel & {
	/** @deprecated */
	did?: Snowflake;
	/** @deprecated */
	nickName?: string;
	/** @deprecated */
	sendCommandTo?: string;
	/** @deprecated */
	sendSearchTo?: string;
};

export type SageChannel = SageChannelOptions & {
	id: Snowflake;
};

export const SageChannelV1Keys: (keyof SageChannel)[] = [
	...ChannelOptionsV1Keys,
	...DialogOptionsKeys,
	...DiceOptionsKeys,
	...GameSystemOptionsV1Keys,
	"id",
];

export function assertSageChannel(objectType: string, core: SageChannelAny): core is SageChannel {
	if (!isSimpleObject<SageChannel>(core)) return false;
	if (!assertChannelOptions(objectType, core)) return false;
	if (!assertDialogOptions({ core, objectType })) return false;
	if (!assertDiceOptions({ core, objectType })) return false;
	if (!assertGameSystemOptionsV1(objectType, core)) return false;
	if (!assertString({ core, objectType, key:"id", validator:isNonNilSnowflake })) return false;
	return true
}

export function ensureSageChannel(core: SageChannelOld, _?: EnsureOptions): SageChannel {
	ensureChannelOptions(core);
	ensureDialogOptions(core);
	ensureDiceOptions(core);
	ensureGameSystemOptionsV1(core);

	// move did to id
	renameProperty({ core, oldKey:"did", newKey:"id" });

	// delete unused old stuff
	delete core.nickName;
	delete core.sendCommandTo;
	delete core.sendSearchTo;

	return core as SageChannel;
}