import { isNonNilSnowflake, type Snowflake } from "@rsc-utils/core-utils";
import { assertString, isSimpleObject, renameProperty } from "../validation/index.js";
import { assertChannelOptions, ChannelOptionsV1Keys, ensureChannelOptions, type ChannelOptions } from "./ChannelOptions.js";
import { assertDialogOptions, DialogOptionsKeys, ensureDialogOptions, type DialogOptions } from "./DialogOptions.js";
import { assertDiceOptions, DiceOptionsKeys, ensureDiceOptions, type DiceOptions } from "./DiceOptions.js";
import { assertGameSystemOptions, ensureGameSystemOptions, GameSystemOptionsKeys, type GameSystemOptions } from "./GameSystemOptions.js";

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

export const SageChannelKeys: (keyof SageChannel)[] = [
	...ChannelOptionsV1Keys,
	...DialogOptionsKeys,
	...DiceOptionsKeys,
	...GameSystemOptionsKeys,
	"id",
];

export function assertSageChannel({ core, objectType }: { core:SageChannelAny; objectType:string; }): boolean {
	if (!isSimpleObject<SageChannel>(core)) return false;
	if (!assertChannelOptions({ core, objectType })) return false;
	if (!assertDialogOptions({ core, objectType })) return false;
	if (!assertDiceOptions({ core, objectType })) return false;
	if (!assertGameSystemOptions({ core, objectType })) return false;
	if (!assertString({ core, objectType, key:"id", validator:isNonNilSnowflake })) return false;
	return true
}

export function ensureSageChannel(core: SageChannelOld): SageChannel | undefined {
	ensureChannelOptions(core);
	ensureDialogOptions(core);
	ensureDiceOptions(core);
	ensureGameSystemOptions(core);

	// move did to id
	renameProperty({ core, oldKey:"did", newKey:"id" });

	// delete unused old stuff
	delete core.nickName;
	delete core.sendCommandTo;
	delete core.sendSearchTo;

	return core;
}