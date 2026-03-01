import { debug, isNonNilSnowflake, isNotBlank, type Snowflake } from "@rsc-utils/core-utils";
import { assertArray, assertBoolean, assertNumber, assertSimpleObject, assertString, optional } from "../validation/index.js";

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

export type HasPostCurrency = { postCurrency?:PostCurrency; };

function isPostCurrencyIncrementPostType(value: unknown): value is PostCurrencyIncrementPostType {
	return isPostCurrencyUserCountPostType(value) || value === "all";
}

function isPostCurrencyUserCountPostType(value: unknown): value is PostCurrencyUserCountPostType {
	return value === "dialog" || value === "dice";
}

function assertPostCurrencyIncrement({ core, objectType }: { core:PostCurrencyIncrement; objectType:string; }): boolean {
	if (!assertSimpleObject<PostCurrencyIncrement>(core)) return false;
	if (!assertString({ core, objectType, key:"channelId", optional, validator:isNonNilSnowflake })) return false;
	if (!assertString({ core, objectType, key:"postType", validator:isPostCurrencyIncrementPostType })) return false;
	if (!assertNumber({ core, objectType, key:"increment" })) return false;
	return true;
}

function assertPostCurrencyUserCount({ core, objectType }: { core:PostCurrencyUserCount; objectType:string; }): boolean {
	if (!assertSimpleObject<PostCurrencyUserCount>(core)) return false;
	if (!assertString({ core, objectType, key:"userId", validator:isNonNilSnowflake })) return false;
	if (!assertString({ core, objectType, key:"channelId", validator:isNonNilSnowflake })) return false;
	if (!assertString({ core, objectType, key:"postType", validator:isPostCurrencyUserCountPostType })) return false;
	if (!assertNumber({ core, objectType, key:"count" })) return false;
	return true;
}

function assertPostCurrencyDataEvent({ core, objectType }: { core:PostCurrencyDataEvent; objectType:string; }): boolean {
	if (!assertSimpleObject<PostCurrencyDataEvent>(core)) return false;
	if (!assertArray({ core, objectType, key:"increments", asserter:assertPostCurrencyIncrement })) return false;
	if (!assertArray({ core, objectType, key:"userCounts", asserter:assertPostCurrencyUserCount })) return false;
	if (!assertNumber({ core, objectType, key:"beginTs" })) return false;
	if (!assertNumber({ core, objectType, key:"endTs", optional })) return false;
	return true;
}

function assertPostCurrencyDataTotal({ core, objectType }: { core:PostCurrencyDataTotal; objectType:string; }): boolean {
	if (!assertSimpleObject<PostCurrencyDataTotal>(core)) return false;
	if (!assertString({ core, objectType, key:"userId", validator:isNonNilSnowflake })) return false;
	if (!assertNumber({ core, objectType, key:"dialog" })) return false;
	if (!assertNumber({ core, objectType, key:"dice" })) return false;
	if (!assertNumber({ core, objectType, key:"value" })) return false;
	return true;
}

export function assertPostCurrency({ core, objectType }: { core:PostCurrency; objectType:string; }): boolean {
	if (!assertSimpleObject<PostCurrency>(core)) return false;
	for (const [key, data] of Object.entries(core)) {
		if (key !== data.key) debug({ key, dataKey:data.key });
		if (!assertString({ core:data, objectType, key:"key", validator:isNotBlank })) return false;
		if (!assertString({ core:data, objectType, key:"name", validator:isNotBlank })) return false;
		if (!assertString({ core:data, objectType, key:"description", optional, validator:isNotBlank })) return false;
		if (!assertBoolean({ core:data, objectType, key:"disabled", optional })) return false;
		if (!assertArray({ core:data, objectType, key:"events", asserter:assertPostCurrencyDataEvent })) return false;
		if (!assertArray({ core:data, objectType, key:"totals", asserter:assertPostCurrencyDataTotal })) return false;
	}
	return true;
}

// const arr = [
// 	{
// 		"increments":[{"postType":"dialog","increment":10}],
// 		"beginTs":1736886915798,
// 		"userCounts":[
// 			{"userId":"366176581871337473","channelId":"1317444969664876544","postType":"dialog","count":2},
// 			{"userId":"530412998368559104","channelId":"1317444969664876544","postType":"dialog","count":2},
// 			{"userId":"156740742113394688","channelId":"1317444969664876544","postType":"dialog","count":1},
// 			{"userId":"366176581871337473","channelId":"1317444969664876544","postType":"dice","count":1},
// 			{"userId":"156740742113394688","channelId":"1317444969664876544","postType":"dice","count":1},
// 			{"userId":"366176581871337473","channelId":"1317444997393682462","postType":"dice","count":12},
// 			{"userId":"366176581871337473","channelId":"1317444997393682462","postType":"dialog","count":6},
// 			{"userId":"529768844701466624","channelId":"1320103139067559986","postType":"dialog","count":12},
// 			{"userId":"156740742113394688","channelId":"1320103139067559986","postType":"dialog","count":7},
// 			{"userId":"291851975212007430","channelId":"1317444969664876544","postType":"dialog","count":1},
// 			{"userId":"291851975212007430","channelId":"1320103139067559986","postType":"dialog","count":8},
// 			{"userId":"366176581871337473","channelId":"1320103139067559986","postType":"dialog","count":26},
// 			{"userId":"291851975212007430","channelId":"1320103139067559986","postType":"dice","count":1}
// 		]
// 	}
// ]