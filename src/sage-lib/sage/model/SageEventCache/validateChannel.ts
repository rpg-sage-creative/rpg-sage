import { parseSageChannelTags, SageChannelType, type SageChannel, type SageChannelTag } from "@rsc-sage/types";
import type { Snowflake } from "@rsc-utils/core-utils";
import { isSupportedThreadChannel, type SupportedCategoryChannel, type SupportedDMChannel, type SupportedForumChannel, type SupportedGameChannel } from "@rsc-utils/discord-utils";
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

	tags: SageChannelTag[];
	type?: SageChannelType;
	typeLabel?: string;
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

	tags: SageChannelTag[];
	type?: SageChannelType;
	typeLabel?: string;
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

	tags: SageChannelTag[];
	type?: SageChannelType;
	typeLabel?: string;
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

	tags?: never[];
	type?: never;
	typeLabel?: never;
};

export type ValidatedChannel = ValidatedSupportedChannel | ValidatedSupportedCategory | ValidatedSupportedForum | UnvalidatedChannel;

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

	const { tags = parent?.tags ?? [], type = parent?.type, label:typeLabel = parent?.typeLabel } = parseSageChannelTags(discord, sage?.type);

	const typeTagsAndFlags = {
		isAutoDice: type === SageChannelType.AutoDice,
		isAutoIC: type === SageChannelType.AutoInCharacter,
		isDice: type === SageChannelType.Dice,
		isGM: type === SageChannelType.GameMaster,
		isIC: type === SageChannelType.InCharacter,
		isMisc: type === SageChannelType.Miscellaneous,
		isNone: type === SageChannelType.None,
		isOOC: type === SageChannelType.OutOfCharacter,
		tags,
		type,
		typeLabel
	};

	if (discord.type === 4) {
		const category: ValidatedSupportedCategory = {
			id,
			discord,
			sage,
			isCategory: true,
			isValidated: true,
			...typeTagsAndFlags,
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
			...typeTagsAndFlags,
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
		...typeTagsAndFlags,
	};
	return channel;
}
