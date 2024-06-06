import { DicePostType, parseDicePostType } from "./DicePostType.js";
import { DiceSecretMethodType, parseDiceSecretMethodType } from "./DiceSecretMethodType.js";
import { GameSystemType, GameType, parseGameSystem } from "./GameSystem.js";
import { parsePostType, PostType } from "./PostType.js";
import { parseSageChannelType, SageChannelType } from "./SageChannel.js";
import type { EnumLike, Optional } from "@rsc-utils/core-utils";
import { parseEnum as parse } from "@rsc-utils/core-utils";
import { DialogPostType, parseDialogPostType } from "./DialogPostType.js";
import { DiceCritMethodType, parseDiceCritMethodType } from "./DiceCritMethodType.js";

export function parseEnum<K extends string = string, V extends number = number>(enumLike: EnumLike<K, V>, value?: Optional<string>): V;
export function parseEnum<K extends string = string, V extends number = number>(enumLike: EnumLike<K, V>, value?: Optional<string>) {
	if (enumLike === DialogPostType) {
		return parseDialogPostType(value);
	}
	if (enumLike === DiceCritMethodType) {
		return parseDiceCritMethodType(value);
	}
	// DiceOutputType
	if (enumLike === DicePostType) {
		return parseDicePostType(value);
	}
	if (enumLike === DiceSecretMethodType) {
		return parseDiceSecretMethodType(value);
	}
	if (enumLike === GameSystemType || enumLike === GameType) {
		return parseGameSystem(value)?.type;
	}
	if (enumLike === PostType) {
		return parsePostType(value);
	}
	if (enumLike === SageChannelType) {
		return parseSageChannelType(value);
	}
	return parse(enumLike, value);
}
