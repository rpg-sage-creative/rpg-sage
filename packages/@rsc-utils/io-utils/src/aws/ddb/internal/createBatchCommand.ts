import { BatchGetItemCommand, BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";
import type { BatchGetRequestItems, BatchWriteRequestItems, RepoItem, TableNameParser } from "../types.js";
import { serialize, serializeKey } from "./serialize.js";

export function createBatchCommand(type: "Delete" | "Get" | "Put", keys: RepoItem[], tableNameParser: TableNameParser) {
	switch (type) {
		case "Delete": return createBatchDeleteCommand(keys, tableNameParser);
		case "Get": return createBatchGetCommand(keys, tableNameParser);
		case "Put": return createBatchPutCommand(keys, tableNameParser);
	}
}

export function createBatchDeleteCommand(keys: RepoItem[], tableNameParser: TableNameParser) {
	const RequestItems: BatchWriteRequestItems = { };
	for (const item of keys) {
		const tableName = tableNameParser(item.objectType);
		const tableItems = RequestItems[tableName] ??= [];
		tableItems.push({ DeleteRequest: { Key: serializeKey(item) } });
	}
	return new BatchWriteItemCommand({ RequestItems });
}

export function createBatchGetCommand(keys: RepoItem[], tableNameParser: TableNameParser) {
	const RequestItems: BatchGetRequestItems = { };
	for (const item of keys) {
		const tableName = tableNameParser(item.objectType);
		const tableItems = RequestItems[tableName] ??= { Keys:[] };
		tableItems.Keys.push(serializeKey(item));
	}
	return new BatchGetItemCommand({ RequestItems });
}

export function createBatchPutCommand(items: RepoItem[], tableNameParser: TableNameParser) {
	const RequestItems: BatchWriteRequestItems = { };
	for (const item of items) {
		const tableName = tableNameParser(item.objectType);
		const tableItems = RequestItems[tableName] ??= [];
		tableItems.push({ PutRequest: { Item: serialize(item).M! } });
	}
	return new BatchWriteItemCommand({ RequestItems });
}
