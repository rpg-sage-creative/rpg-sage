import { isHexColorString, isNonNilSnowflake, isNotBlank, type HexColorString, type Snowflake } from "@rsc-utils/core-utils";
import { isUrl } from "@rsc-utils/io-utils";
import { assertArray, assertSageCore, assertSimpleObject, assertString, optional } from "../../assertions/index.js";
import { isAutoChannelData, isMacroBase, isNote, isValidId, type AutoChannelData, type MacroBase, type Note, type SageCore } from "../../types/index.js";
import { tagFailure } from "../../utils/tagFailure.js";
import { assertDeckCoreV1, assertSageMessageReferenceV1, type DeckCoreV1, type SageMessageReferenceV1 } from "../index.js";

export type SageCharacterCoreV1 = Omit<SageCore<"Character", Snowflake>, "did"> & {
	aka?: string;
	alias?: string;
	autoChannels?: AutoChannelData[];
	avatarUrl?: string;
	companions?: SageCharacterCoreV1[];
	decks?: DeckCoreV1[];
	embedColor?: HexColorString;
	essence20?: unknown;
	essence20Id?: string;
	hephaistos?: unknown;
	hephaistosId?: string;
	lastMessages?: SageMessageReferenceV1[];
	macros?: MacroBase[];
	name: string;
	notes?: Note[];
	pathbuilder?: unknown;
	pathbuilderId?: string;
	tokenUrl?: string;
	userDid?: Snowflake;
	ver: number;
};

export const SageCharacterCoreV1Keys: (keyof SageCharacterCoreV1)[] = [
	"aka",
	"alias",
	"autoChannels",
	"avatarUrl",
	"companions",
	"decks",
	"embedColor",
	"essence20",
	"essence20Id",
	"hephaistos",
	"hephaistosId",
	"id",
	"lastMessages",
	"macros",
	"name",
	"notes",
	"objectType",
	"pathbuilder",
	"pathbuilderId",
	"tokenUrl",
	"userDid",
	"uuid",
	"ver",
];

// const AliasRegExp = /^\w+$/;
const objectType = "Character";
export function assertSageCharacterCoreV1(core: unknown): core is SageCharacterCoreV1 {
	if (!assertSageCore<SageCharacterCoreV1>(core, objectType, SageCharacterCoreV1Keys)) return false;

	if (!assertString({ core, objectType, key:"aka", validator:isNotBlank, optional })) return false;
	if (!assertString({ core, objectType, key:"alias", validator:isNotBlank, optional })) return false;
	if (!assertArray({ core, objectType, key:"autoChannels", validator:isAutoChannelData, optional })) return false;
	if (!assertString({ core, objectType, key:"avatarUrl", validator:isUrl, optional })) return false;
	if (!assertArray({ core, objectType, key:"companions", validator:assertSageCharacterCoreV1, optional })) return false;
	if (!assertArray({ core, objectType, key:"decks", validator:assertDeckCoreV1, optional })) return false;
	if (!assertString({ core, objectType, key:"embedColor", validator:isHexColorString, optional })) return false;
	if ("essence20" in core) {
		if (!assertSimpleObject(core.essence20)) return tagFailure`${objectType}: invalid essence20`;
		// test object
	}
	if ("essence20Id" in core) {
		if (!assertString({ core, objectType, key:"essence20Id", validator:isValidId, optional })) return false;
		// test id
	}
	if ("hephaistos" in core) {
		if (!assertSimpleObject(core.hephaistos)) return tagFailure`${objectType}: invalid hephaistos`;
		// test object
	}
	if ("hephaistosId" in core) {
		if (!assertString({ core, objectType, key:"hephaistosId", validator:isNonNilSnowflake, optional })) return false;
		// test id
	}
	if (!assertArray({ core, objectType, key:"lastMessages", validator:assertSageMessageReferenceV1, optional })) return false;
	if (!assertArray({ core, objectType, key:"macros", validator:isMacroBase, optional })) return false;
	if (!assertString({ core, objectType, key:"name", validator:isNotBlank })) return false;
	if (!assertArray({ core, objectType, key:"notes", validator:isNote, optional })) return false;
	// objectType
	if ("pathbuilder" in core) {
		if (!assertSimpleObject(core.pathbuilder)) return tagFailure`${objectType}: invalid pathbuilder`;
		// test object
	}
	if ("pathbuilderId" in core) {
		if (!assertString({ core, objectType, key:"pathbuilderId", validator:isValidId, optional })) return false;
		// is it a valid id; meaning, does it link to an actual pathbuilder character somewhere?
		// validate that character ? ? ?
	}
	if (!assertString({ core, objectType, key:"tokenUrl", validator:isUrl, optional })) return false;
	if (!assertString({ core, objectType, key:"userDid", validator:isNonNilSnowflake, optional })) return false;

	return true;
}