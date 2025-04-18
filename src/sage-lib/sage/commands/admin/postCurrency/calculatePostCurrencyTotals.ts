import { sortByKey, type Snowflake } from "@rsc-utils/core-utils";
import type { PostCurrencyData, PostCurrencyDataEvent, PostCurrencyDataTotal, PostCurrencyIncrement, PostCurrencyUserCount } from "./types.js";

/** returns the user counts that match the given increment. */
function getUserCountsForIncrement(userCounts: PostCurrencyUserCount[], increment: PostCurrencyIncrement): PostCurrencyUserCount[] {
	return userCounts.filter(userCount => {
		// ensure: no channel or the channels match
		if (increment.channelId && increment.channelId !== userCount.channelId) return false;
		// ensure: all post types or the post types match
		if (increment.postType !== "all" && increment.postType !== userCount.postType) return false;
		// we pass the tests
		return true;
	});
}

/** returns the user counts that don't match any increment. */
function getUnvaluedUserCounts(userCounts: PostCurrencyUserCount[], increments: PostCurrencyIncrement[]): PostCurrencyUserCount[] {
	const found = increments.map(increment => getUserCountsForIncrement(userCounts, increment)).flat();
	return userCounts.filter(userCount => !found.includes(userCount));
}

/** Creates the totals/summary records for each user and properly divides the counts by the increment to get the value of the posts related to the given increment. */
function calculateIncrementTotals(dataEvent: PostCurrencyDataEvent, increment: PostCurrencyIncrement): PostCurrencyDataTotal[] {
	const totals: PostCurrencyDataTotal[] = [];

	// get counts for this specific increment
	const incrementCounts = getUserCountsForIncrement(dataEvent.userCounts, increment);

	// create totals and update counts
	incrementCounts.forEach(userCount => {
		const userTotal = getOrCreateUserTotal(totals, userCount.userId);
		userTotal[userCount.postType] += userCount.count;
	});

	// use the final counts to create the value by dividing the increment
	totals.forEach(userTotal => {
		if (increment.postType === "all") {
			userTotal.value = Math.floor((userTotal.dialog + userTotal.dice) / increment.increment);
		}else {
			userTotal.value = Math.floor(userTotal[increment.postType] / increment.increment);
		}
	});

	return totals;
}

/** Creates the totals/summary records for each user by combining the totals from each increment of the event. */
function calculateEventTotals(dataEvent: PostCurrencyDataEvent): PostCurrencyDataTotal[] {
	const totals: PostCurrencyDataTotal[] = [];

	// iterate each increment
	dataEvent.increments.forEach(increment => {
		// get the user subtotals for the given increment
		const incrementDataTotals = calculateIncrementTotals(dataEvent, increment);

		// create / update user totals for the whole event
		incrementDataTotals.forEach(dataTotal => {
			const userTotal = getOrCreateUserTotal(totals, dataTotal.userId);
			userTotal.dialog += dataTotal.dialog;
			userTotal.dice += dataTotal.dice;
			userTotal.value += dataTotal.value;
		});
	});

	return totals;
}

function getOrCreateUserTotal(totals: PostCurrencyDataTotal[], userId: Snowflake): PostCurrencyDataTotal {
	const found = totals.find(total => total.userId === userId);
	if (found) {
		return found;
	}

	const created = { userId, dialog:0, dice:0, value:0 };
	totals.push(created);
	return created;
}

export function calculatePostCurrencyTotals(data: PostCurrencyData): PostCurrencyDataTotal[] {
	const totals: PostCurrencyDataTotal[] = [];

	// iterate each event
	data.events.forEach(dataEvent => {
		// get the user subtotals for the given event
		const eventTotals = calculateEventTotals(dataEvent);

		// create / update user totals for all events
		eventTotals.forEach(total => {
			const userTotal = getOrCreateUserTotal(totals, total.userId);
			userTotal.dialog += total.dialog;
			userTotal.dice += total.dice;
			userTotal.value += total.value;
		});

		// get all userCounts not contributing to a value
		const unvaluedUserCounts = getUnvaluedUserCounts(dataEvent.userCounts, dataEvent.increments);

		// increment their total dialog/dice counts but not any value.
		unvaluedUserCounts.forEach(userCount => {
			const userTotal = getOrCreateUserTotal(totals, userCount.userId);
			userTotal[userCount.postType] += userCount.count;
		});

	});

	totals.sort(sortByKey("value", "dialog", "dice", "userId"));

	return totals;
}
