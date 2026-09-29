import type { BatchGetItemCommandOutput, BatchWriteItemCommandOutput } from "@aws-sdk/client-dynamodb";
import { errorReturnUndefined, type OrUndefined } from "@rsc-utils/core-utils";
import type { DdbRepo } from "../DdbRepo.js";
import type { BatchGetResults, BatchWriteResults, RepoItem } from "../types.js";
import { collectItems } from "./collectItems.js";
import { collectUnprocessedItems } from "./collectUnprocessedItems.js";
import { createBatchCommand } from "./createBatchCommand.js";

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
	items: OrUndefined<Item>[];
	unprocessed: Item[];
};

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
		.catch(errorReturnUndefined);

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