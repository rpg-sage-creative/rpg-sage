import type { BatchGetItemCommandOutput } from "@aws-sdk/client-dynamodb";
import type { Optional, OrUndefined } from "@rsc-utils/core-utils";
import type { RepoItem } from "../types.js";
import { deserializeObject } from "./deserialize.js";

function setItem(
	itemMap: Map<string, Map<string, RepoItem>>,
	item: Optional<RepoItem>
) {

	// ignore undefined items
	if (!item) {
		return;
	}

	// cache key variables
	const { id, objectType } = item;

	// ensure objectType map exists
	if (!itemMap.has(objectType)) {
		itemMap.set(objectType, new Map());
	}

	// add the item
	itemMap
		.get(objectType)!
		.set(id, item);

}

export function collectItems<Item extends RepoItem>(keys: RepoItem[], output?: BatchGetItemCommandOutput): OrUndefined<Item>[] {
	let items: undefined | OrUndefined<Item>[];

	if (output?.Responses) {

		// initialize item map
		const itemMap = new Map<string, Map<string, Item>>();

		// add all received items to the map
		Object
			.values(output.Responses)
			.forEach(serialized => {
				serialized
					.map<Item>(deserializeObject)
					.forEach(item => setItem(itemMap, item));
			});

		// return the items in the order in which they were requested
		items = keys.map(key =>
			itemMap.get(key.objectType)?.get(key.id)
		);

	}
	return items ?? [];
}