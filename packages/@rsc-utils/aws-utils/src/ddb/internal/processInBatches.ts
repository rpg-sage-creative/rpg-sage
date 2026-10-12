import { BatchGetItemCommand, BatchWriteItemCommand, type BatchGetItemCommandOutput, type BatchWriteItemCommandOutput } from "@aws-sdk/client-dynamodb";
import type { DdbRepo } from "../DdbRepo.js";
import type { BatchGetRequestItems, BatchGetResults, BatchWriteRequestItems, BatchWriteResults, RepoItem, TableNameParser } from "../types.js";
import { deserializeObject } from "./deserialize.js";
import { serialize, serializeKey } from "./serialize.js";

//#region createBatchCommand logic

/** Creates a BatchWriteItemCommand with a DeleteRequest for each of the given keys. */
function createBatchDeleteCommand(keys: RepoItem[], tableNameParser: TableNameParser) {
	const RequestItems: BatchWriteRequestItems = { };
	for (const item of keys) {
		const tableName = tableNameParser(item.objectType);
		const tableItems = RequestItems[tableName] ??= [];
		tableItems.push({ DeleteRequest: { Key: serializeKey(item) } });
	}
	return new BatchWriteItemCommand({ RequestItems });
}

/** Creates a BatchGetItemCommand with a BatchGetRequestItems for the given keys. */
function createBatchGetCommand(keys: RepoItem[], tableNameParser: TableNameParser) {
	const RequestItems: BatchGetRequestItems = { };
	for (const item of keys) {
		const tableName = tableNameParser(item.objectType);
		const tableItems = RequestItems[tableName] ??= { Keys:[] };
		tableItems.Keys.push(serializeKey(item));
	}
	return new BatchGetItemCommand({ RequestItems });
}

/** Creates a BatchWriteItemCommand with a PutRequest for each of the given items. */
function createBatchPutCommand(items: RepoItem[], tableNameParser: TableNameParser) {
	const RequestItems: BatchWriteRequestItems = { };
	for (const item of items) {
		const tableName = tableNameParser(item.objectType);
		const tableItems = RequestItems[tableName] ??= [];
		tableItems.push({ PutRequest: { Item: serialize(item).M! } });
	}
	return new BatchWriteItemCommand({ RequestItems });
}

/** Creates the correct Batch command for the given type and keys/items. */
function createBatchCommand(type: "Delete" | "Get" | "Put", keysOrItems: RepoItem[], tableNameParser: TableNameParser) {
	switch (type) {
		case "Delete": return createBatchDeleteCommand(keysOrItems, tableNameParser);
		case "Get": return createBatchGetCommand(keysOrItems, tableNameParser);
		case "Put": return createBatchPutCommand(keysOrItems, tableNameParser);
	}
}

//#endregion

//#region collectItems logic

/** Reusable logic to build out a nested Map by .objectType then .id via an iterator */
function setItem(
	itemMap: Map<string, Map<string, RepoItem>>,
	item: RepoItem | null | undefined,
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

/**
 * Maps the given BatchGetItemCommandOutput to deserialized objects and then returns them in the order requested via the given keys.
 */
function collectItems<Item extends RepoItem>(keys: RepoItem[], output?: BatchGetItemCommandOutput): (Item | undefined)[] {
	let items: undefined | (Item | undefined)[];

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

//#endregion

//#region collectUnprocessedItems logic

/**
 * Collects all unprocessed items from the given BatcheWriteItemCommandOutput.
 * BatcheWriteItemCommandOutput contains UnprocessedItems, but Delete/Put requests use different keys, so this simplifies the task of collecting them.
 */
function collectUnprocessedItems<
	Item extends RepoItem
>(
	output?: BatchWriteItemCommandOutput
): Item[] {
	const unprocessed: Item[] = [];

	// ensure we have unprocessed items
	if (output?.UnprocessedItems) {

		// iterate each unprocessed item
		Object.values(output.UnprocessedItems).forEach(writeRequests => {

			// iterate each write request for each unprocessed items
			writeRequests.forEach(({ DeleteRequest, PutRequest }) => {

				// if delete request, deserialize key
				if (DeleteRequest) {
					unprocessed.push(deserializeObject(DeleteRequest!.Key!));
				}

				// if put request, deserialize entire item
				if (PutRequest) {
					unprocessed.push(deserializeObject(PutRequest!.Item!));
				}

			});

		});
	}

	return unprocessed;
}

//#endregion

type ProcessBatchInArgs<
	Item extends RepoItem,
> = {
	ddbRepo: DdbRepo,
	cmd: "Delete" | "Get" | "Put",
	batchItems: Item[],
};

type ProcessBatchOutArgs<
	Item extends RepoItem,
> = {
	batchCount: number;
	errorCount: number;
	items: (Item | undefined)[];
	unprocessed: Item[];
};

/**
 * Processes a single batch of ddb commands.
 * Response / Output is collected and added to the outArgs so that processInBatches has a single response object that covers all batches.
 * @param inArgs the args needed to process this batch
 * @param outArgs the object that contains the results of all batches being processed together
 */
async function processBatch<
	Item extends RepoItem,
>(
	inArgs: ProcessBatchInArgs<Item>,
	outArgs: ProcessBatchOutArgs<Item>,
): Promise<void> {

	const { cmd, ddbRepo, batchItems } = inArgs;

	const command = createBatchCommand(cmd, batchItems, ddbRepo.tableNameParser);

	const response = await ddbRepo
		.getClient()
		.send(command as any)
		// .catch(errorReturnUndefined)
		.catch(() => {});

	outArgs.batchCount++;

	if (response?.$metadata.httpStatusCode !== 200) {
		outArgs.errorCount++;
	}

	if (cmd === "Get") {
		outArgs.items = outArgs.items
			.concat(collectItems<Item>(batchItems, response as BatchGetItemCommandOutput));

	}else {
		outArgs.unprocessed = outArgs.unprocessed
			.concat(collectUnprocessedItems<Item>(response as BatchWriteItemCommandOutput));
	}
}

type ProcessInBatchesResults<Item extends RepoItem> = BatchGetResults<Item> | BatchWriteResults<Item>;


export async function processInBatches<
	Item extends RepoItem,
>(
	ddbRepo: DdbRepo,
	cmd: "Delete" | "Put",
	itemsOrKeys: Item[],
): Promise<BatchWriteResults<Item>>;


export async function processInBatches<
	Item extends RepoItem,
>(
	ddbRepo: DdbRepo,
	cmd: "Get",
	itemsOrKeys: Item[],
): Promise<BatchGetResults<Item>>;

export async function processInBatches<
	Item extends RepoItem,
>(
	ddbRepo: DdbRepo,
	cmd: "Delete" | "Get" | "Put",
	itemsOrKeys: Item[],
): Promise<ProcessInBatchesResults<Item>> {

	const batchMaxItemCount = cmd === "Get"
		? ddbRepo.batchGetMaxItemCount
		: ddbRepo.batchPutMaxItemCount;

	const results: ProcessBatchOutArgs<Item> = {
		batchCount: 0,
		errorCount: 0,
		items: [],
		unprocessed: [],
	};

	let startIndex = 0;
	let batchItems: Item[];

	while (startIndex < itemsOrKeys.length) {
		// select the next batch of items
		batchItems = itemsOrKeys.slice(startIndex, startIndex + batchMaxItemCount);

		// if we don't get any items, we are done
		if (!batchItems.length) break;

		// ... process the batch
		await processBatch<Item>({ ddbRepo, cmd, batchItems }, results);

		// advance the startIndex
		startIndex += batchItems.length;
	}

	if (cmd === "Get") {
		return {
			batchCount: results.batchCount,
			errorCount: results.errorCount,
			items: results.items,
		};
	}

	const unprocessedCount = results.unprocessed.length;
	return {
		batchCount: results.batchCount,
		errorCount: results.errorCount,
		partial: unprocessedCount > 0 && unprocessedCount < itemsOrKeys.length,
		success: results.errorCount === 0 && unprocessedCount === 0,
		unprocessed: results.unprocessed,
	};
}