import type { HexColorString, Snowflake } from "@rsc-utils/core-utils";
import type { DialogPostType, MacroBase } from "../../types/index.js";
import type { DeckCoreV1, SageMessageReferenceV1 } from "../index.js";

export type SageCharacterV2 = {
	/** short name used to ease dialog access */
	alias?: string;

	/** contains channel specific settings/options */
	channelData?: Record<Snowflake, {
		/** contains auto dialog settings for specific channels */
		autoDialog?: {
			/** if not the default for the channel/game/server */
			dialogPostType?: DialogPostType | undefined;
			/** if a char shared by users */
			userId?: Snowflake;
		};
		/**
		 * the last message for this character in each channel;
		 * possibly used to reply to the last user to post as this character?
		 * possibly used to detect when there are new posts to respond to?
		 */
		lastMessage?: SageMessageReferenceV1;
	}>;

	/** character specific decks; experimental deck logic */
	decks?: DeckCoreV1[];

	/** contains data about the character's dialog presence */
	dialog: {
		/** Discord compatible color: #001122 */
		emedColor?: HexColorString;
		/** contains the various images used by this character */
		images?: {
			/** tags combine to determine their use */
			tags: ("avatar" | "default" | "dialog" | "profile" | "token")[];
			/** valid url to the image */
			url: string;
		}[];
	};

	/** unique identifier for this character */
	id: Snowflake;

	/** contains data about the last import */
	import: {
		/** represents the hephaistos character id, the pathbuilder json export id, or the file name */
		id: string;
		/** represents the key mapper needed for referencing/importing/exporting stats */
		keyMapper?: "hephaistos-1e" | "hephaistos-2e" | "pathbuilder-2e";
		/** the Date.now() of the import */
		ts: number;
		/** the complete url used to import the character */
		url: string;
	};

	/** character specific macros */
	macros?: MacroBase[];

	/** required name for this character */
	name: string;

	/** The character's companion characters */
	related: {
		/** related character's id */
		id: Snowflake;
		/** replaces "alt" | "companion" | "familiar" | "hireling" | "minion" */
		relationship: string;
	}[];

	/** contains all stats (imported or manual) */
	stats: {
		/** user given key or json path for imported data */
		key: string;
		/** the stat's value */
		value: boolean | number | string;
	}[];

	/** the Date.now() of the last saved change */
	updatedTs: number;
};