import { parseEnum as parse, type EnumLike, type Optional } from "@rsc-utils/core-utils";
import { DiceCriticalMethodType, GameSystemType, parseDiceCriticalMethodType, parseGameSystem } from "@rsc-utils/game-utils";
import { DialogPostType, parseDialogPostType } from "./DialogPostType.js";
import { DicePostType, parseDicePostType } from "./DicePostType.js";
import { DiceSecretMethodType, parseDiceSecretMethodType } from "./DiceSecretMethodType.js";
import { parsePostType, PostType } from "./PostType.js";
import { parseSageChannelType, SageChannelType } from "./SageChannel.js";

export function parseEnum<K extends string = string, V extends number = number>(enumLike: EnumLike<K, V>, value?: Optional<string>): V;
export function parseEnum<K extends string = string, V extends number = number>(enumLike: EnumLike<K, V>, value?: Optional<string>) {
	if (enumLike === DialogPostType) {
		return parseDialogPostType(value);
	}
	if (enumLike === DiceCriticalMethodType) {
		return parseDiceCriticalMethodType(value);
	}
	// DiceOutputType
	if (enumLike === DicePostType) {
		return parseDicePostType(value);
	}
	if (enumLike === DiceSecretMethodType) {
		return parseDiceSecretMethodType(value);
	}
	if (enumLike === GameSystemType) {
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
