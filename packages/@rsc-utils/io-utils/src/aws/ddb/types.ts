import type { AttributeValue } from "@aws-sdk/client-dynamodb";
import type { OrUndefined, Snowflake, UUID } from "@rsc-utils/core-utils";

export type RepoId = Snowflake | UUID;

export type RepoItem<
	Id extends RepoId = RepoId,
	ObjectType extends string = string,
> = {
	/** should be a Snowflake */
	id: Id;
	/** ex: Character, Game, User */
	objectType: ObjectType;
};

export type BatchRequestKey = {
	/** Id / RANGE */
	id: AttributeValue;
	/** Partition / HASH */
	objectType: AttributeValue;
};

type BatchDeleteRequestItem = { Key: BatchRequestKey; };

type BatchGetRequestItem = { Keys: BatchRequestKey[]; };

type BatchPutRequestItem = { Item: Record<string, AttributeValue>; };

type BatchWriteRequestItem
	= { DeleteRequest: BatchDeleteRequestItem; }
	| { PutRequest: BatchPutRequestItem; };

export type BatchGetRequestItems = Record<string, BatchGetRequestItem>;

export type BatchGetResults<Item> = {
	/** how many batches did it take to process the items */
	batchCount: number;
	/** individual item errors */
	errorCount: number;
	/** the items returned in the order they were requested, with undefined for keys that "missed" */
	items: OrUndefined<Item>[];
};

export type BatchWriteRequestItems = Record<string, BatchWriteRequestItem[]>;

export type BatchWriteResults<Item> = {
	/** how many batches did it take to process the items */
	batchCount: number;
	/** number of errors from client.send(command); can be 1 per batch */
	errorCount: number;
	/** any items that weren't written correctly */
	unprocessed: Item[];
	/** true if there are no errors and no unprocessed items */
	success: boolean;
	/** true if some items were processed successfully */
	partial: boolean;
};

export type TableNameParser = (objectType: string) => string;

export type UnprocessedItem<
	Id extends RepoId,
> = {
	/** should be a Snowflake */
	id: Id;
	/** ex: dice, messages, games */
	tableName: string;
};
