import { isDefined, type Snowflake } from "@rsc-utils/core-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import type { SageCommand } from "../../model/SageCommand.js";

type PostCurrencyPostType = "all" | "command" | "dialog" | "dice" | "message" | "reaction" | "tupper";

type PostCurrencyIncrement = {
	channelId?: Snowflake;
	postType: PostCurrencyPostType;
	increment: number;
};

type PostCurrencyUserCount = {
	userId: Snowflake;
	channelId: Snowflake;
	postType: PostCurrencyPostType;
	count: number;
};

type PostCurrencyDataEvent = {
	increments: PostCurrencyIncrement[];
	userCounts: PostCurrencyUserCount[];
	beginTs: number;
	endTs?: number;
};

type PostCurrencyDataTotal = {
	userId: Snowflake;
	dialog: number;
	dice: number;
	value: number;
};

type PostCurrencyData = {
	key: string;
	name: string;
	description?: string;
	disabled?: boolean;
	events: PostCurrencyDataEvent[];
	totals: PostCurrencyDataTotal[];
};
// addCurrency(core, key, name, description, postIncrement, dialogIncrement, diceIncrement)

type PostCurrency = {
	[key:string]: PostCurrencyData;
};

export type CoreWithPostCurrency = {
	postCurrency?: PostCurrency;
};

export interface HasPostCurrency {
	postCurrency: PostCurrency;
}

function calculateTotals(data: PostCurrencyData): void {
	const totals: PostCurrencyDataTotal[] = [];
	data.events.forEach(dataEvent => {
		dataEvent.userCounts.forEach(userCount => {
			const increment = dataEvent.increments.find(inc => {
				// ensure: no channel or the channels match
				if (inc.channelId && inc.channelId !== userCount.channelId) return false;
				// ensure: all post types or the post types match
				if (inc.postType !== "all" && inc.postType !== userCount.postType) return false;
				// we pass the tests
				return true;
			});
			if (increment) {
				let total = totals.find(t => t.userId === userCount.userId);
				if (!total) {
					total = { userId:userCount.userId, dialog:0, dice:0, value:0 };
					totals.push(total);
				}
				if (["dialog", "dice"].includes(userCount.postType)) {
					total[userCount.postType as "dialog"] += userCount.count;
				}
				if (increment.increment) {
					total.value += Math.floor(userCount.count / increment.increment);
				}
			}
		});
	});
	data.totals = totals;
}

export async function logPostCurrency(sageCommand: SageCommand, postType: Exclude<PostCurrencyPostType, "all">): Promise<void> {
	if (sageCommand.game && sageCommand.channelDid) {
		const changes = logPostsWithAll(sageCommand.game, {
			userId: sageCommand.sageUser.did,
			channelId: sageCommand.channelDid,
			postType,
			count: 1
		});
		if (changes) {
			await sageCommand.game.save();
		}
	}
}

/** Logs the posts with all the different currencies, each of which has their totals updated. */
function logPostsWithAll({ postCurrency }: HasPostCurrency, ...bulkUserCounts: PostCurrencyUserCount[]): boolean {
	let changes = false;
	const postCurrencyDatas = Object.values(postCurrency ?? {});
	for (const postCurrencyData of postCurrencyDatas) {
		if (!postCurrencyData.disabled) {
			const changed = logPostsWithOne(postCurrencyData, ...bulkUserCounts);
			changes ||= changed;
		}
	}
	return changes;
}

/** Logs the posts with the given currency and updates the totals. */
function logPostsWithOne(postCurrencyData: PostCurrencyData, ...bulkUserCounts: PostCurrencyUserCount[]): boolean {
	let changes = false;
	const userCounts = postCurrencyData.events[0].userCounts;
	for (const { userId, channelId, postType, count } of bulkUserCounts) {
		let userCount = userCounts.find(uc => uc.userId === userId && uc.channelId === channelId && uc.postType === postType);
		if (!userCount) {
			userCount = { userId, channelId, postType, count:0 };
			userCounts.push(userCount);
		}
		userCount.count += count ?? 1;
		changes = true;
	}
	if (changes) {
		calculateTotals(postCurrencyData);
	}
	return changes;
}

type AddPostCurrencyEventOptions = {
	key: string;
	name?: string | null;
	description?: string | null;

	/** @todo implement other increment types */
	dialogIncrement?: number;
	diceIncrement?: number;

	/** if true, all previous events are remove but previous counts are included in new totals */
	recalculateTotals?: boolean;
	/** if true, all previous events and counts are removed. */
	resetCounts?: boolean;
};

/**
 * Adds a PostCurrencyEvent, adding the currency if it doesn't yet exist.
 * Optionally resets counts or recalculates totals.
 */
export function addPostCurrencyEvent({ postCurrency }: HasPostCurrency, options: AddPostCurrencyEventOptions): boolean {
	let changed = false;

	// ensure the postCurrency we are working with exists
	const key = options.key.toLowerCase();
	const { name, description } = options;
	if (!postCurrency[key]) {
		postCurrency[key] = { key, name:name??key, description:description??undefined, events:[], totals:[] };
		changed = true;
	}

	const postCurrencyData = postCurrency[key];

	// update name
	if (name !== undefined && postCurrencyData.name !== name) {
		postCurrencyData.name = name ?? key;
		changed = true;
	}

	// update description
	if (description !== undefined && postCurrencyData.description !== description) {
		postCurrencyData.description = description ?? undefined;
		changed = true;
	}

	const oldEvents = postCurrencyData.events;

	// resetting counts and recalculating totals both rely on removing the old data
	if (postCurrencyData.events.length && (options.resetCounts || options.recalculateTotals)) {
		postCurrencyData.events = [];
		changed = true;
	}

	/* postCurrencyData.data uses unshift so that the [0] index is always the newest */

	/** @todo implement other increment types and per channel differences */
	const types = ["dialog", "dice"] as PostCurrencyPostType[];
	const isDifferent = types.some(type => {
		const optIncrement = options[`${type}Increment` as "dialogIncrement"];
		const typeIncrement = postCurrencyData.events[0]?.increments.find(inc => inc.postType === type);
		return typeIncrement?.increment !== optIncrement;
	});
	if (isDifferent) {
		const increments: PostCurrencyIncrement[] = [];
		types.forEach(postType => {
			const increment = options[`${postType}Increment` as "dialogIncrement"];
			if (isDefined(increment)) {
				increments.push({ postType, increment });
			}
		});
		const now = Date.now();
		if (postCurrencyData.events[0]) {
			postCurrencyData.events[0].endTs = now;
		}
		postCurrencyData.events.unshift({ increments, beginTs:now, userCounts:[] })
		changed = true;
	}

	// if we are recalculating, let's relog currency
	if (options.recalculateTotals && oldEvents.some(ev => ev.userCounts.some(uc => uc.count))) {
		// create bulkUserCounts for logging
		const bulkUserCounts: PostCurrencyUserCount[] = [];

		// iterate the old data userCounts
		oldEvents.forEach(({ userCounts }) => {
			// iterate the old userCounts
			userCounts.forEach(uc => bulkUserCounts.push(uc));
		});

		// log old counts; will also calculate totals
		const logged = logPostsWithOne(postCurrencyData, ...bulkUserCounts);
		changed ||= logged;

	// we need to make sure we have totals ready for reading
	}else if (changed) {
		calculateTotals(postCurrencyData);
	}

	return changed;
}

type RemovePostCurrencyOptions = {
	key: string;
};

/** Removes a type of Currency */
export function removePostCurrency({ postCurrency }: HasPostCurrency, options: RemovePostCurrencyOptions): boolean {
	const key = options.key.toLowerCase();
	if (postCurrency[key]) {
		delete postCurrency[key];
		return true;
	}
	return false;
}

type TogglePostCurrencyOptions = {
	key: string;
};

/** Toggles a type of Currency between enabled and disabled. */
export function togglePostCurrency({ postCurrency }: HasPostCurrency, options: TogglePostCurrencyOptions): boolean {
	const key = options.key.toLowerCase();
	if (postCurrency[key]) {
		postCurrency[key].disabled = !postCurrency[key].disabled;
		return true;
	}
	return false;
}

type PlayerInfo = { userId:Snowflake; name:string; };
export function renderPostCurrency({ postCurrency }: HasPostCurrency, renderableContent: RenderableContent, players: PlayerInfo[]): void {
	const postCurrencyData = Object.values(postCurrency);
	if (postCurrencyData.length) {
		renderableContent.append(`<b>Post Currency Settings</b>`);
		postCurrencyData.forEach(data => {
			if (data.disabled) {
				renderableContent.append(`[spacer]${data.name ?? data.key}: *disabled*`);
			}else {
				data.events[0].increments.forEach(inc => {
					renderableContent.append(`[spacer]${data.name ?? data.key}: ${inc.increment ?? 0} ${inc.postType} posts`);
				});
			}
		});
		renderableContent.append(`<b>Post Currency Values</b>`);
		players.map(player => {
			const values: string[] = [];
			postCurrencyData.forEach(data => {
				const userData = data.totals.find(t => t.userId === player.userId);
				const types = ["dialog", "dice"].map(type => {
					const count = userData?.[type as "dialog"] ?? 0;
					return count ? `${count} ${type}` : undefined;
				}).filter(s => s);
				const value = userData?.value ?? 0;
				const typesText = types.length ? `(${types.join(", ")})` : ``;
				values.push(`${value} ${data.name ?? data.key} ${typesText}`.trim());
			});
			renderableContent.append(`[spacer]${player.name}: ${values.join("; ")}`);
		});
	}
}
