import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import type { DiceCriticalMethodType, DiceOutputType, DiceSecretMethodType, DiceSortType, GameSystemType } from "@rsc-utils/game-utils";
import type { DialogPostType } from "./DialogPostType.js";
import type { DicePostType } from "./DicePostType.js";

export type DialogOptions = {
	dialogPostType: DialogPostType;
	gmCharacterName: string;
	mentionPrefix?: string;
	moveDirectionOutputType?: number;
	sendDialogTo: Snowflake;
};

export type DiceOptions = {
	diceCritMethodType: DiceCriticalMethodType;
	diceOutputType: DiceOutputType;
	dicePostType: DicePostType;
	diceSecretMethodType: DiceSecretMethodType;
	diceSortType: DiceSortType;
	sendDiceTo: Snowflake;
};

export type SystemOptions = {
	gameSystemType: GameSystemType;
};

export type ChannelOptions = {
	type: SageChannelType;
}

export type SageChannelOptions = DialogOptions & DiceOptions & SystemOptions & ChannelOptions;

export type SageChannel = Partial<SageChannelOptions> & {
	/** @deprecated */
	did?: Snowflake;
	id: Snowflake;
};


export enum SageChannelType {
	None = 0,
	InCharacter = 1,
	OutOfCharacter = 2,
	GameMaster = 3,
	Miscellaneous = 4,
	Dice = 5,
	AutoInCharacter = 6,
	AutoDice = 7,
}

const SageChannelTags = ["auto", "dice", "gm", "ic", "misc", "none", "ooc"] as const;

export type SageChannelTag = typeof SageChannelTags[number];

export function isSageChannelTag(value?: Optional<string>): value is SageChannelTag {
	return SageChannelTags.includes(value as SageChannelTag);
}

type DiscordChannelLike = { name:string; } | { name:string; topic:string|null; } | { name:string; appliedTags:string[]; };

/** reusable function to convert string array to tags */
function tagsFrom(tags: Optional<string[]>): SageChannelTag[] {
	const set = new Set<SageChannelTag>();
	tags?.forEach(tag => {
		const lower = tag.toLowerCase();
		if (isSageChannelTag(lower)) {
			set.add(lower);
		}
	});
	return [...set];
}

function appliedTagsToTags(channel: DiscordChannelLike): SageChannelTag[] {
	if ("appliedTags" in channel) {
		return tagsFrom(channel.appliedTags);
	}
	return [];
}

let regexTopic: RegExp;
function topicToTags(channel: DiscordChannelLike): SageChannelTag[] {
	if ("topic" in channel) {
		regexTopic ??= /^\s*channel\s*tags\s*:\s*(\w+(?:(?:\s*,\s*|\s+)\w+)*)\s*;?\s*$/i;
		const line = channel.topic?.split("\n").find(line => regexTopic.test(line));
		return tagsFrom(line?.toLowerCase().split(/\W/));
	}
	return [];
}

let regexGM: RegExp;
let regexAutoIC: RegExp;
let regexIC: RegExp;
let regexOOC: RegExp;
let regexMisc: RegExp;
let regexAutoDice: RegExp;
let regexDice: RegExp;
let regexNone: RegExp;
function stringToTags(value: Optional<string>): SageChannelTag[] {
	if (value) {
		regexGM ??= /\b(gm|game[ -]?master)s?\b/i;
		if (regexGM.test(value)) {
			return ["gm"];
		}

		regexAutoIC ??= /\b(auto[ -]?ic|ic[ -]?auto|auto[ -]?in[ -]?char(acter)?|in[ -]?char(acter)?[ -]?auto)\b/i;
		if (regexAutoIC.test(value)) {
			return ["ic", "auto"];
		}

		regexIC ??= /\b(ic|in[ -]?char(acter)?)\b/i;
		if (regexIC.test(value)) {
			return ["ic"];
		}

		regexOOC ??= /\b(ooc|out[ -]?of[ -]?char(acter)?)\b/i;
		if (regexOOC.test(value)) {
			return ["ooc"];
		}

		regexMisc ??= /\bmisc(ellaneous)?\b/i;
		if (regexMisc.test(value)) {
			return ["misc"];
		}

		regexAutoDice ??= /\b(auto[ -]?dice|dice[ -]?auto)\b/i;
		if (regexAutoDice.test(value)) {
			return ["dice", "auto"];
		}

		regexDice ??= /\bdice\b/i;
		if (regexDice.test(value)) {
			return ["dice"];
		}

		regexNone ??= /\bnone\b/i;
		if (regexNone.test(value)) {
			return ["none"];
		}
	}
	return [];
}

function tagsToType(tags: SageChannelTag[]): SageChannelType | undefined {
	const auto = tags.includes("auto");
	for (const tag of tags) {
		switch(tag) {
			case "dice": return auto ? SageChannelType.AutoDice : SageChannelType.Dice;
			case "gm": return SageChannelType.GameMaster;
			case "ic": return auto ? SageChannelType.AutoInCharacter : SageChannelType.InCharacter;
			case "misc": return SageChannelType.Miscellaneous;
			case "none": return SageChannelType.None;
			case "ooc": return SageChannelType.OutOfCharacter;
			default: break;
		}
	}
	return undefined;
}

function typeToTags(type?: SageChannelType): SageChannelTag[] {
	switch(type) {
		case SageChannelType.AutoDice: return ["dice", "auto"];
		case SageChannelType.AutoInCharacter: return ["ic", "auto"];
		case SageChannelType.Dice: return ["dice"];
		case SageChannelType.GameMaster: return ["gm"];
		case SageChannelType.InCharacter: return ["ic"];
		case SageChannelType.Miscellaneous: return ["misc"];
		case SageChannelType.None: return ["none"];
		case SageChannelType.OutOfCharacter: return ["ooc"];
		default: return [];
	}
}

export function toReadableSageChannelType(type?: SageChannelType): string | undefined {
	switch(type) {
		case SageChannelType.AutoDice: return "Auto Dice";
		case SageChannelType.AutoInCharacter: return "Auto IC <i>(In Character)</i>";
		case SageChannelType.Dice: return "Dice";
		case SageChannelType.GameMaster: return "GM <i>(Game Master)</i>";
		case SageChannelType.InCharacter: return "IC <i>(In Character)</i>";
		case SageChannelType.Miscellaneous: return "Misc";
		case SageChannelType.None: return "None";
		case SageChannelType.OutOfCharacter: return "OOC <i>(Out of Character)</i>";
		default: return undefined;
	}
}

type ParseResults = {
	label?: string;
	tags: SageChannelTag[];
	type?: SageChannelType;
};

export function parseSageChannelTags(channel: DiscordChannelLike, type?: SageChannelType): ParseResults {
	// use set to avoid duplicates
	const set = new Set<SageChannelTag>();

	// cleaner than using forEach on each of the returned values
	const add = (tags: SageChannelTag[]) => tags.forEach(tag => set.add(tag));

	// start with explicitly given type
	add(typeToTags(type));

	// try applied tags next
	if (!set.size) {
		add(appliedTagsToTags(channel));
	}

	// then try parsing tags from topic
	if (!set.size) {
		add(topicToTags(channel));
	}

	// lastly try parsing tags from name
	if (!set.size) {
		add(stringToTags(channel.name));
	}

	// tags as array
	const tags = [...set];

	// ensure we have the updated type
	type ??= tagsToType(tags);

	const label = toReadableSageChannelType(type);

	// return results
	return { label, tags, type };
}

export function parseSageChannelType(value: Optional<string>): SageChannelType | undefined {
	return tagsToType(stringToTags(value));
}
