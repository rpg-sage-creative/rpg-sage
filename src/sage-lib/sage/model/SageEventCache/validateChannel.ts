import { parseSageChannelType, SageChannelType, type SageChannel } from "@rsc-sage/types";
import type { Snowflake } from "@rsc-utils/core-utils";
import { isSupportedThreadChannel, type SupportedCategoryChannel, type SupportedChannelOrParent, type SupportedDMChannel, type SupportedForumChannel, type SupportedGameChannel } from "@rsc-utils/discord-utils";
import type { SageEventCache } from "../SageEventCache.js";

export type ValidatedSupportedChannel = {
	id: Snowflake;

	discord: SupportedGameChannel;
	sage?: SageChannel;

	parent?: ValidatedSupportedCategory | ValidatedSupportedForum | ValidatedSupportedChannel;
	/** channel not in game, but parent is */
	byParent: boolean;

	isCategory?: false;
	isChannel: boolean;
	isForum?: false;
	isThread: boolean;
	isChannelThread: boolean;
	isForumThread: boolean;
	isValidated: true;

	isDice: boolean;
	isGM: boolean;
	isIC: boolean;
	isMisc: boolean;
	isNone: boolean;
	isOOC: boolean;

	// nameTags: MappedChannelNameTags;
	type?: SageChannelType;
};

export type ValidatedSupportedCategory = {
	id: Snowflake;

	discord: SupportedCategoryChannel;
	sage?: SageChannel;

	parent?: never;
	/** channel not in game, but parent is */
	byParent?: never;

	isCategory: true;
	isChannel?: false;
	isForum?: false;
	isThread?: false;
	isChannelThread?: false;
	isForumThread?: false;
	isValidated: true;

	isDice: boolean;
	isGM: boolean;
	isIC: boolean;
	isMisc: boolean;
	isNone: boolean;
	isOOC: boolean;

	// nameTags: MappedChannelNameTags;
	type?: SageChannelType;
};

export type ValidatedSupportedForum = {
	id: Snowflake;

	discord: SupportedForumChannel;
	sage?: SageChannel;

	parent?: ValidatedSupportedCategory;
	/** channel not in game, but parent is */
	byParent: boolean;

	isCategory?: false;
	isChannel?: false;
	isForum: true;
	isThread?: false;
	isChannelThread?: false;
	isForumThread?: false;
	isValidated: true;

	isDice: boolean;
	isGM: boolean;
	isIC: boolean;
	isMisc: boolean;
	isNone: boolean;
	isOOC: boolean;

	// nameTags: MappedChannelNameTags;
	type?: SageChannelType;
};

export type ValidatedGameChannel = ValidatedSupportedChannel | ValidatedSupportedCategory | ValidatedSupportedForum;

export type UnvalidatedChannel = {
	id: Snowflake;

	discord?: SupportedDMChannel;
	sage?: SageChannel;

	parent?: never;
	/** channel not in game, but parent is */
	byParent?: false;

	isCategory?: false;
	isChannel?: false;
	isForum?: false;
	isThread?: false;
	isChannelThread?: false;
	isForumThread?: false;
	isValidated: false;

	isDice?: false;
	isGM?: false;
	isIC?: false;
	isMisc?: false;
	isNone?: false;
	isOOC?: false;

	// nameTags: MappedChannelNameTags;
	type?: never;
};

export type ValidatedChannel = ValidatedSupportedChannel | ValidatedSupportedCategory | ValidatedSupportedForum | UnvalidatedChannel;

const channelTags = {
	"dice": SageChannelType.Dice,
	"gm": SageChannelType.GameMaster,
	"ic": SageChannelType.InCharacter,
	"misc": SageChannelType.Miscellaneous,
	"none": SageChannelType.None,
	"ooc": SageChannelType.OutOfCharacter,
};

function findChannelType(channel?: SupportedChannelOrParent): SageChannelType | undefined {
	if (!channel) return undefined;

	// was SageChannelType.None found?
	let none = false;

	if ("appliedTags" in channel) {
		for (const tag of channel.appliedTags) {
			const lower = tag.toLowerCase();
			const type = lower in channelTags ? channelTags[lower as keyof typeof channelTags] : undefined;
			if (type) return type;
			none ||= type === SageChannelType.None;
		}
	}

	if ("name" in channel) {
		const type = parseSageChannelType(channel.name);
		if (type) return type;
		none ||= type === SageChannelType.None;
	}

	if ("topic" in channel) {
		const type = parseSageChannelType(channel.topic);
		if (type) return type;
		none ||= type === SageChannelType.None;
	}

	return none ? SageChannelType.None : undefined;
}

export async function validateChannel(sageEventCache: SageEventCache, id: Snowflake, { sageChannel:sage, parent }: { sageChannel?: SageChannel, parent?: ValidatedChannel }): Promise<ValidatedChannel> {
	const discord = await sageEventCache.fetchChannel(id);
	if (!discord || discord.type === 1) {
		const unvalidated: UnvalidatedChannel = {
			id,
			discord,
			sage,
			isValidated: false,
		};
		return unvalidated;
	}

	const type = sage?.type ?? findChannelType(discord) ?? parent?.type;
	const typeValues = {
		isDice: type === SageChannelType.Dice,
		isGM: type === SageChannelType.GameMaster,
		isIC: type === SageChannelType.InCharacter,
		isMisc: type === SageChannelType.Miscellaneous,
		isNone: type === SageChannelType.None,
		isOOC: type === SageChannelType.OutOfCharacter,
		type
	};

	if (discord.type === 4) {
		const category: ValidatedSupportedCategory = {
			id,
			discord,
			sage,
			isCategory: true,
			isValidated: true,
			...typeValues
		};
		return category;
	}

	if (discord.type === 15) {
		const forum: ValidatedSupportedForum = {
			id,
			discord,
			sage,
			isForum: true,
			isValidated: true,
			byParent: false,
			...typeValues
		};
		return forum;
	}

	const isThread = isSupportedThreadChannel(discord);

	const channel: ValidatedSupportedChannel = {
		id,
		discord: discord,
		sage,
		isChannel: discord.type === 0,
		isChannelThread: isThread && discord.parent?.type === 0,
		isForumThread: isThread && discord.parent?.type === 15,
		isThread,
		isValidated: true,
		byParent: false,
		...typeValues
	};
	return channel;
};