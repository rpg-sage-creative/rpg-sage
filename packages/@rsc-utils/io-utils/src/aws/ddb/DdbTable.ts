import { DeleteItemCommand, GetItemCommand, PutItemCommand, QueryCommand, type AttributeValue, type CreateTableCommandOutput, type DeleteItemCommandOutput, type DeleteTableCommandOutput, type GetItemCommandOutput, type PutItemCommandOutput, type QueryCommandInput, type QueryCommandOutput, type ScanCommandOutput, type UpdateTimeToLiveCommandOutput } from "@aws-sdk/client-dynamodb";
import { errorReturnUndefined, type Awaitable, type OrUndefined, type Snowflake } from "@rsc-utils/core-utils";
import { DdbRepo } from "./DdbRepo.js";
import { deserializeObject } from "./internal/deserialize.js";
import { processInBatches } from "./internal/processInBatches.js";
import { serialize } from "./internal/serialize.js";
import type { BatchWriteResults, RepoId, RepoItem } from "./types.js";

export class DdbTable<Id extends RepoId = RepoId, Item extends RepoItem<Id> = RepoItem<Id>> {
	public readonly tableName: string;

	public constructor(public repo: DdbRepo, public objectType: string) {
		this.tableName = repo.tableNameParser(objectType);
	}

	/** used by .forEachAsync and .query */
	private createQueryCommandInput(): QueryCommandInput {
		return {
			TableName: this.tableName,
			KeyConditionExpression: "#objectType = :objectType",
			ExpressionAttributeNames: {
				"#objectType": "objectType",
			},
			ExpressionAttributeValues: {
				":objectType": serialize(this.objectType),
			},
		};
	}

	/** returns true if the item in the table is deleted */
	public async delete(id: Id): Promise<boolean>;
	/** returns true if all the items in the table are deleted */
	public async delete(ids: Id[]): Promise<boolean>;
	/** returns BatchDeleteResults */
	public async delete(ids: Id[], returnOutput: true): Promise<BatchWriteResults<RepoItem<Id>>>;
	public async delete(idOrIds: Id | Id[], returnOutput?: boolean): Promise<boolean | BatchWriteResults<RepoItem<Id>>> {
		if (!idOrIds) return false;

		if (Array.isArray(idOrIds)) {
			const keys = idOrIds.map(id => ({ id, objectType:this.objectType }));
			const response = await processInBatches(this.repo, "Delete", keys);
			return returnOutput
				? response
				: response.success;
		}

		const command = new DeleteItemCommand({
			TableName: this.tableName,
			Key: {
				id: serialize(idOrIds),
				objectType: serialize(this.objectType),
			},
		});

		const response = await this.send(command).catch(errorReturnUndefined);

		return response?.$metadata.httpStatusCode === 200;
	}

	/** @deprecated @internal drops the table if it exists ... DEBUG / TEST ONLY */
	public async drop(): Promise<boolean>;
	public async drop(returnOutput: true): Promise<DeleteTableCommandOutput>;
	public async drop(returnOutput?: boolean): Promise<boolean | DeleteTableCommandOutput> {
		return this.repo.dropTable(this.tableName, returnOutput as true);
	}

	/** @deprecated @internal ensures the table exists ... DEBUG / TEST ONLY */
	public async ensure(): Promise<boolean>;
	public async ensure(returnOutput: true): Promise<{ create:CreateTableCommandOutput; update?:UpdateTimeToLiveCommandOutput; }>;
	public async ensure(returnOutput?: boolean): Promise<boolean | { create:CreateTableCommandOutput; update?:UpdateTimeToLiveCommandOutput; }> {
		const exists = await this.exists();
		if (!exists) {
			const createTableArgs = DdbRepo.getCreateTableInput(this.tableName);
			const updateTableArgs = DdbRepo.getUpdateTimeToLiveInput(this.tableName);
			return this.repo.createTable(createTableArgs, updateTableArgs, returnOutput as true);
		}
		return true;
	}

	public async exists(): Promise<boolean | undefined> {
		const tableNames = await this.repo.getTableNames();
		return tableNames?.includes(this.tableName);
	}

	/**
	 * Queries the table for objects with matching objectType and iterates them.
	 * callbackfn array will always be an empty array.
	 *
	 * @param callbackfn
	 * @param thisArg
	 * @returns
	 */
	public async forEachAsync<T extends Item = Item>(callbackfn: (value: T, index: number, array: T[]) => Awaitable<unknown>, thisArg?: any): Promise<void> {
		const input = this.createQueryCommandInput();

		let index = -1;
		const array: T[] = [];

		const client = this.repo.getClient();
		let results: ScanCommandOutput | undefined;
		do {

			// store anything we catch
			let err: unknown;
			results = await client.query(input)
				.catch(reason => { err = reason; return undefined; });

			// let the calling function know that something went wrong and we didn't iterate every item
			if (err || results?.$metadata.httpStatusCode !== 200) {
				return Promise.reject(err ?? results?.$metadata.httpStatusCode);
			}

			const items = results.Items ?? [];
			for (const item of items) {
				index++;

				// this call could throw an exception
				// because it isn't our code, we are ignoring it so they have to deal with it
				await callbackfn.call(thisArg, deserializeObject(item), index, array);
			}

			input.ExclusiveStartKey = results.LastEvaluatedKey;

		}while(results.LastEvaluatedKey !== undefined);

	}

	/** returns the item in the table for the given id */
	public async get<T extends Item = Item>(id: Id): Promise<OrUndefined<T>>;
	/** returns the items in the table for the given ids */
	public async get<T extends Item = Item>(ids: Id[]): Promise<OrUndefined<T>[]>;
	public async get<T extends Item = Item>(idOrIds: Id | Id[]): Promise<OrUndefined<T> | OrUndefined<T>[]> {
		// a single undefined id
		if (!idOrIds) return undefined;

		// process the array through DdbRepo's batch logic
		if (Array.isArray(idOrIds)) {
			const keys = idOrIds.map(id => ({ id, objectType:this.objectType }));
			const response = await processInBatches(this.repo, "Get", keys);
			return response.items as T[];
		}

		// process a single id with a GetItemCommand

		const command = new GetItemCommand({
			TableName: this.tableName,
			Key: {
				id: serialize(idOrIds),
				objectType: serialize(this.objectType),
			},
		});

		const response = await this.send(command).catch(errorReturnUndefined);

		if (response?.Item) {
			return deserializeObject(response.Item);
		}

		return undefined;
	}

	/** returns all the items in the table */
	public async getAll<T extends Item = Item>(): Promise<T[]> {
		return this.query({}) as Promise<T[]>;
	}

	/** A prebuilt query conmand that returns all table items of the objecttype that match the given filter arguments (archived/relatedId) */
	public async query({ archived, relatedId }: { archived?:boolean; relatedId?:Snowflake; }): Promise<Item[]> {
		//#region create input

		const input = this.createQueryCommandInput();

		const expressions: string[] = [];

		if (typeof(archived) === "boolean") {
			(input.ExpressionAttributeNames as Record<string, string>)["#archivedTs"] = "archivedTs";
			(input.ExpressionAttributeValues as Record<string, string | AttributeValue>)[":archivedTs_value"] = serialize(0);
			if (archived) {
				(input.ExpressionAttributeValues as Record<string, string | AttributeValue>)[":archivedTs_type"] = "N";
				expressions.push(`(attribute_exists(#archivedTs) AND attribute_type(#archivedTs, :archivedTs_type) AND #archivedTs > :archivedTs_value)`);
			}else {
				(input.ExpressionAttributeValues as Record<string, string | AttributeValue>)[":archivedTs_type"] = "NULL";
				expressions.push(`(attribute_not_exists(#archivedTs) OR attribute_type(#archivedTs, :archivedTs_type) OR #archivedTs = :archivedTs_value)`);
			}
		}

		if (relatedId) {
			(input.ExpressionAttributeNames as Record<string, string>)["#relatedIds"] = "relatedIds";
			(input.ExpressionAttributeValues as Record<string, string | AttributeValue>)[":relatedId"] = serialize(relatedId);
			expressions.push(`contains(#relatedIds, :relatedId)`);
		}

		input.FilterExpression = expressions.join(" AND ") || undefined!;

		//#endregion

		const array: Item[] = [];

		const client = this.repo.getClient();
		let results: QueryCommandOutput | undefined;
		do {

			// store anything we catch
			let err: unknown;
			results = await client.query(input)
				.catch(reason => { err = reason; return undefined; });

			// let the calling function know that something went wrong and we didn't iterate every item
			if (err || results?.$metadata.httpStatusCode !== 200) {
				return Promise.reject(err ?? results?.$metadata.httpStatusCode);
			}

			results.Items?.forEach(item => array.push(deserializeObject(item)));

			input.ExclusiveStartKey = results.LastEvaluatedKey;

		}while(results.LastEvaluatedKey !== undefined);

		return array;
	}

	/** returns true if the item is saved */
	public async save<T extends Item = Item>(value: T): Promise<boolean>;
	/** returns true if all the items are saved */
	public async save<T extends Item = Item>(values: T[]): Promise<boolean>;
	/** returns BatchWriteResults */
	public async save<T extends Item = Item>(values: T[], returnOutput: true): Promise<BatchWriteResults<Item>>;
	public async save<T extends Item = Item>(valueOrValues: T | T[], returnOutput?: boolean): Promise<boolean | BatchWriteResults<Item>> {
		if (!valueOrValues) return false;

		if (Array.isArray(valueOrValues)) {
			const response = await processInBatches(this.repo, "Put", valueOrValues);
			return returnOutput
				? response
				: response.success;
		}

		const command = new PutItemCommand({
			TableName: this.tableName,
			Item: serialize(valueOrValues as object).M,
		});

		const response = await this.send(command).catch(errorReturnUndefined);

		return response?.$metadata.httpStatusCode === 200;
	}

	public async send(cmd: DeleteItemCommand): Promise<DeleteItemCommandOutput>;
	public async send(cmd: GetItemCommand): Promise<GetItemCommandOutput>;
	public async send(cmd: PutItemCommand): Promise<PutItemCommandOutput>;
	public async send(cmd: QueryCommand): Promise<QueryCommandOutput>;
	public async send(cmd: unknown) {
		return this.repo.getClient().send(cmd as GetItemCommand);
	}
}
