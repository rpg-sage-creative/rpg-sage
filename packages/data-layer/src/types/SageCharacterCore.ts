import { isHexColorString, isNonNilSnowflake, isNotBlank, randomSnowflake, type HexColorString, type Snowflake } from "@rsc-utils/core-utils";
import { isUrl } from "@rsc-utils/io-utils";
import { assertArray, assertSageCore, assertSimpleObject, assertString, deleteInvalidHexColorString, deleteInvalidString, deleteInvalidUrl, ensureArray, isAutoChannelData, isMacroBase, isNote, isValidId, optional, renameProperty, tagFailure, type EnsureContext, } from "../validation/index.js";
import { assertDeckCore, ensureDeckCore, type DeckCore } from "./DeckCore.js";
import { assertSageMessageReferenceCore, ensureSageMessageReferenceCore, type SageMessageReferenceCore, type SageMessageReferenceCoreOld } from "./SageMessageReferenceCore.js";
import type { MacroBase, Note, SageCore } from "./index.js";
import { ensureAutoChannelData, type AutoChannelData } from "./other/AutoChannelData.js";

export type SageCharacterCoreAny = SageCharacterCore | SageCharacterCoreOld;

export type SageCharacterCoreOld = Omit<SageCharacterCore, "companions" | "lastMessages"> & {
	/** @deprecated */
	aka?: string;
	alias?: string;
	autoChannels?: AutoChannelData[];
	avatarUrl?: string;
	companions?: SageCharacterCoreOld[];
	decks?: DeckCore[];
	embedColor?: HexColorString;
	essence20?: unknown;
	essence20Id?: string;
	hephaistos?: unknown;
	hephaistosId?: string;
	/** @deprecated */
	iconUrl?: string;
	lastMessages?: SageMessageReferenceCoreOld[];
	macros?: MacroBase[];
	name: string;
	/** @deprecated */
	nameLower?: string;
	notes?: Note[];
	pathbuilder?: unknown;
	pathbuilderId?: string;
	tokenUrl?: string;
	userDid?: Snowflake;
};

export type SageCharacterCore = Omit<SageCore<"Character", Snowflake>, "did"> & {
	alias?: string;
	autoChannels?: AutoChannelData[];
	avatarUrl?: string;
	companions?: SageCharacterCore[];
	decks?: DeckCore[];
	embedColor?: HexColorString;
	essence20?: unknown;
	essence20Id?: string;
	hephaistos?: unknown;
	hephaistosId?: string;
	lastMessages?: SageMessageReferenceCore[];
	macros?: MacroBase[];
	name: string;
	notes?: Note[];
	pathbuilder?: unknown;
	pathbuilderId?: string;
	tokenUrl?: string;
	userDid?: Snowflake;
	ver: number;
};

export const SageCharacterCoreKeys: (keyof SageCharacterCore)[] = [
	// "aka",
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
];

// const AliasRegExp = /^\w+$/;
const objectType = "Character";
export function assertSageCharacterCore(core: SageCharacterCoreAny): core is SageCharacterCore {
	if (!assertSageCore<SageCharacterCore>(core, objectType, SageCharacterCoreKeys)) return false;

	// if (!assertString({ core, objectType, key:"aka", validator:isNotBlank, optional })) return false;
	if (!assertString({ core, objectType, key:"alias", validator:isNotBlank, optional })) return false;
	if (!assertArray({ core, objectType, key:"autoChannels", validator:isAutoChannelData, optional })) return false;
	if (!assertString({ core, objectType, key:"avatarUrl", validator:isUrl, optional })) return false;
	if (!assertArray({ core, objectType, key:"companions", validator:assertSageCharacterCore, optional })) return false;
	if (!assertArray({ core, objectType, key:"decks", validator:assertDeckCore, optional })) return false;
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
	if (!assertArray({ core, objectType, key:"lastMessages", validator:assertSageMessageReferenceCore, optional })) return false;
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

export function ensureSageCharacterCore(core: SageCharacterCoreOld, context?: EnsureContext): SageCharacterCore {
	if (!core.id) core.id = randomSnowflake();

	const userId = context?.userId ?? isNonNilSnowflake(core.userDid) ? core.userDid : undefined;

	// delete core.aka;
	deleteInvalidString({ core, key:"alias" }); // regex:/\w+/i ? ? ?
	ensureArray({ core, key:"autoChannels", handler:ensureAutoChannelData });
	// deleteEmptyArray({ core, key:"autoChannels" });
	deleteInvalidUrl({ core, key:"avatarUrl" });
	ensureArray({ core, key:"companions", optional, handler:ensureSageCharacterCore, context });
	ensureArray({ core, key:"decks", optional, handler:ensureDeckCore, context})
	deleteInvalidHexColorString({ core, key:"embedColor" });
	// essence20
	// essence20Id
	// hephaistos
	// hephaistosId
	renameProperty({ core, oldKey:"iconUrl", newKey:"tokenUrl" });
	// id
	ensureArray({ core, key:"lastMessages", optional, handler:ensureSageMessageReferenceCore, context:{ ...context, characterId:core.id, userId } });
	// deleteEmptyArray({ core, key:"macros" });
	// name
	delete core.nameLower;
	// deleteEmptyArray({ core, key:"notes" });
	core.objectType = "Character";
	// pathbuilder
	// pathbuilderId
	deleteInvalidUrl({ core, key:"tokenUrl" });
	core.userDid = userId;
	// uuid

	return core as SageCharacterCore;
}

// export type SageCharacterCoreV2 = {
// 	/** short name used to ease dialog access */
// 	alias?: string;

// 	/** contains channel specific settings/options */
// 	channelData?: Record<Snowflake, {
// 		/** contains auto dialog settings for specific channels */
// 		autoDialog?: {
// 			/** if not the default for the channel/game/server */
// 			dialogPostType?: DialogPostType | undefined;
// 			/** if a char shared by users */
// 			userId?: Snowflake;
// 		};
// 		/**
// 		 * the last message for this character in each channel;
// 		 * possibly used to reply to the last user to post as this character?
// 		 * possibly used to detect when there are new posts to respond to?
// 		 */
// 		lastMessage?: SageMessageReferenceCoreV1;
// 	}>;

// 	/** character specific decks; experimental deck logic */
// 	decks?: DeckCore[];

// 	/** contains data about the character's dialog presence */
// 	dialog: {
// 		/** Discord compatible color: #001122 */
// 		emedColor?: HexColorString;
// 		/** contains the various images used by this character */
// 		images?: {
// 			/** tags combine to determine their use */
// 			tags: ("avatar" | "default" | "dialog" | "profile" | "token")[];
// 			/** valid url to the image */
// 			url: string;
// 		}[];
// 	};

// 	/** unique identifier for this character */
// 	id: Snowflake;

// 	/** contains data about the last import */
// 	import: {
// 		/** represents the hephaistos character id, the pathbuilder json export id, or the file name */
// 		id: string;
// 		/** represents the key mapper needed for referencing/importing/exporting stats */
// 		keyMapper?: "hephaistos-1e" | "hephaistos-2e" | "pathbuilder-2e";
// 		/** the Date.now() of the import */
// 		ts: number;
// 		/** the complete url used to import the character */
// 		url: string;
// 	};

// 	/** character specific macros */
// 	macros?: MacroBase[];

// 	/** required name for this character */
// 	name: string;

// 	/** The character's companion characters */
// 	related: {
// 		/** related character's id */
// 		id: Snowflake;
// 		/** replaces "alt" | "companion" | "familiar" | "hireling" | "minion" */
// 		relationship: string;
// 	}[];

// 	/** contains all stats (imported or manual) */
// 	stats: {
// 		/** user given key or json path for imported data */
// 		key: string;
// 		/** the stat's value */
// 		value: boolean | number | string;
// 	}[];

// 	/** the Date.now() of the last saved change */
// 	updatedTs: number;
// };
