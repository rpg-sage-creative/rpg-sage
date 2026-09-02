import type { Snowflake } from "@rsc-utils/core-utils";

export type PostCurrencyUserCountPostType = "dialog" | "dice";
export type PostCurrencyIncrementPostType = PostCurrencyUserCountPostType | "all";
// type PostCurrencyPostType = "all" | "command" | "dialog" | "dice" | "message" | "reaction" | "tupper";

export type PostCurrencyIncrement = {
	channelId?: Snowflake;
	postType: PostCurrencyIncrementPostType;
	increment: number;
};

export type PostCurrencyUserCount = {
	userId: Snowflake;
	channelId: Snowflake;
	postType: PostCurrencyUserCountPostType;
	count: number;
};

export type PostCurrencyDataEvent = {
	increments: PostCurrencyIncrement[];
	userCounts: PostCurrencyUserCount[];
	beginTs: number;
	endTs?: number;
};

export type PostCurrencyDataTotal = {
	userId: Snowflake;
	dialog: number;
	dice: number;
	value: number;
};

export type PostCurrencyData = {
	key: string;
	name: string;
	description?: string;
	disabled?: boolean;
	events: PostCurrencyDataEvent[];
	totals: PostCurrencyDataTotal[];
};
// addCurrency(core, key, name, description, postIncrement, dialogIncrement, diceIncrement)

export type PostCurrency = {
	[key:string]: PostCurrencyData;
};