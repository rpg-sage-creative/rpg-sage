import { AttributeValue, BatchGetItemCommand, BatchWriteItemCommand, CreateTableCommand, DeleteItemCommand, DeleteTableCommand, DynamoDB, GetItemCommand, ListTablesCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { errorReturnUndefined, partition, toLiteral, warn, type Optional, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { deserializeObject } from "./internal/deserialize.js";
import { serialize } from "./internal/serialize.js";

/*
 * 400 KB max json size in DDB
 */

type RepoId = Snowflake | UUID;
type RepoItem<Id extends RepoId = Snowflake> = { id:Id; objectType:string; };
type BatchGetRequestItems = Record<string, { Keys:{ id:AttributeValue; }[] }>;
type BatchWriteRequestItems = Record<string, { PutRequest?:{ Item:Record<string, AttributeValue>; }; DeleteRequest?:{ Key: { id:AttributeValue; }; }; }[]>;

export class DdbRepo<Id extends RepoId = Snowflake, Item extends RepoItem<Id> = RepoItem<Id>> {
	public constructor(public tableName: string) { }

	public async deleteById(id: Optional<Id>): Promise<boolean> {
		if (id) {
			const command = new DeleteItemCommand({
				TableName: this.tableName,
				Key: { id: serialize(id) }
			});

			const response = await DdbRepo.getClient().send(command).catch(errorReturnUndefined);
			return response?.$metadata.httpStatusCode === 200;
		}

		/** @todo throw error? */
		return false;
	}

	public async getById(id: Optional<Id>): Promise<Item | undefined> {
		if (id) {
			const command = new GetItemCommand({
				TableName: this.tableName,
				Key: { id: serialize(id) }
			});

			const response = await DdbRepo.getClient().send(command).catch(errorReturnUndefined);
			if (response?.Item) {
				return deserializeObject(response.Item);
			}
		}

		return undefined;
	}

	public async getByIds(...ids: Optional<Id>[]): Promise<(Item | undefined)[]> {
		const keys = ids.map(id => id ? ({ id, objectType:this.tableName }) : undefined);
		const results = await DdbRepo.getBy<Id>(...keys);
		return results.values as (Item | undefined)[];
	}

	public async save(value: Optional<Item>): Promise<boolean> {
		if (value?.id) {
			const command = new PutItemCommand({
				TableName: this.tableName,
				Item: serialize(value as object).M
			});

			const response = await DdbRepo.getClient().send(command).catch(errorReturnUndefined);
			return response?.$metadata.httpStatusCode === 200;
		}

		/** @todo throw error? */
		return false;
	}

	public static async testConnection(client = DdbRepo.getClient()): Promise<boolean> {
		const command = new ListTablesCommand({});
		const response = await client.send(command).catch(() => undefined);
		return response !== undefined;
	}

	protected static getClient(): DynamoDB {
		return new DynamoDB({
			credentials: {
				accessKeyId: "ACCESSKEYID",
				secretAccessKey: "SECRETACCESSKEY",
			},
			endpoint: "http://localhost:8000",
			region: "local",
			// region: "us-west-1",
		});
	}

	public static async getBy<Id extends RepoId, Item extends RepoItem<Id> = RepoItem<Id>>(...keys: Optional<Item>[]) {
		let errorCount = 0;

		const values: (Item | undefined)[] = [];

		const { BatchGetMaxItemCount } = DdbRepo;
		const batches = partition(keys, (_, index) => Math.floor(index / BatchGetMaxItemCount));
		for (const batch of batches) {

			// make by hand to use key.objectType as table name
			const RequestItems: BatchGetRequestItems = { };
			batch.forEach(key => {
				// double check we have a valid id
				if (key?.id && key.objectType) {
					const keyItem = RequestItems[key.objectType] ?? (RequestItems[key.objectType] = { Keys:[] });
					keyItem.Keys.push({ id:serialize(key.id) });
				}else {
					warn(`Invalid Key: DdbRepo.getBy(${toLiteral(key)})`);
				}
			});

			// send the request
			const command = new BatchGetItemCommand({ RequestItems });
			const response = await DdbRepo.getClient().send(command).catch(errorReturnUndefined);
			if (response?.$metadata.httpStatusCode !== 200) errorCount++; // NOSONAR
			if (response?.Responses) {

				// deserialize items
				const batchItems = Object.keys(response.Responses).reduce((map, objectType) => {
					map.set(objectType, response.Responses![objectType].map(deserializeObject) as Item[]);
					return map;
				}, new Map<string, (Item | undefined)[]>());

				// return the items in the order in which they were requested
				batch.forEach(key => {
					values.push(key?.id ? batchItems.get(key.objectType)?.find(item => item?.id === key.id) : undefined);
				});
			}
		}

		const batchCount = batches.length;
		return {
			batchCount,
			errorCount,
			values
		};
	}

	public static async deleteAll(...keys: Optional<RepoItem>[]) {
		let errorCount = 0;
		const unprocessed: RepoItem[] = [];

		const { BatchPutMaxItemCount } = DdbRepo;
		const batches = partition(keys, (_, index) => Math.floor(index / BatchPutMaxItemCount));
		for (const batch of batches) {
			const RequestItems: BatchWriteRequestItems = { };
			batch.forEach(key => {
				// double check we have a valid id / type
				if (key?.id && key.objectType) {
					const tableItem = RequestItems[key.objectType] ?? (RequestItems[key.objectType] = []);
					tableItem.push({ DeleteRequest:{ Key:{ id:serialize(key.id) } } });
				}else {
					warn(`Invalid Value: DdbRepo.deleteAll(${toLiteral(key)})`);
				}
			});

			const command = new BatchWriteItemCommand({ RequestItems });
			const response = await DdbRepo.getClient().send(command).catch(errorReturnUndefined);
			if (response?.$metadata.httpStatusCode !== 200) errorCount++; // NOSONAR
			if (response?.UnprocessedItems) {
				Object.keys(response.UnprocessedItems).forEach(objectType => {
					response.UnprocessedItems?.[objectType]?.forEach(({DeleteRequest}) => {
						const id = deserializeObject<RepoItem>(DeleteRequest?.Key!).id;
						unprocessed.push({ id, objectType });
					});
				});
			}
		}

		const unprocessedCount = unprocessed.length;
		return {
			batchCount: batches.length,
			errorCount,
			unprocessed,
			success: errorCount === 0 && unprocessedCount === 0,
			partial: unprocessedCount > 0 && unprocessedCount < keys.length
		};
	}

	public static async saveAll<Item extends RepoItem>(...values: Item[]) {
		let errorCount = 0;
		const unprocessed: Item[] = [];

		const { BatchPutMaxItemCount } = DdbRepo;
		const batches = partition(values, (_, index) => Math.floor(index / BatchPutMaxItemCount));
		for (const batch of batches) {
			const RequestItems: BatchWriteRequestItems = { };
			batch.forEach(value => {
				// double check we have a valid id / type
				if (value.id && value.objectType) {
					const tableItem = RequestItems[value.objectType] ?? (RequestItems[value.objectType] = []);
					tableItem.push({ PutRequest:{ Item:serialize(value).M! } });
				}else {
					warn(`Invalid Value: DdbRepo.saveAll(${toLiteral(value)})`);
				}
			});

			const command = new BatchWriteItemCommand({ RequestItems });
			const response = await DdbRepo.getClient().send(command).catch(errorReturnUndefined);
			if (response?.$metadata.httpStatusCode !== 200) errorCount++; // NOSONAR
			if (response?.UnprocessedItems) {
				Object.keys(response.UnprocessedItems).forEach(objectType => {
					response.UnprocessedItems?.[objectType]?.forEach(wr => {
						unprocessed.push(deserializeObject<Item>(wr.PutRequest!.Item!));
					});
				});
			}
		}

		const unprocessedCount = unprocessed.length;
		return {
			batchCount: batches.length,
			errorCount,
			unprocessed,
			success: errorCount === 0 && unprocessedCount === 0,
			partial: unprocessedCount > 0 && unprocessedCount < values.length
		};
	}

	/** ensures the table exists ... DEBUG / TEST ONLY */
	public static async for(tableName: string): Promise<DdbRepo> {
		const client = DdbRepo.getClient();
		const command = new ListTablesCommand({});
		const response = await client.send(command);//.catch(errorReturnUndefined);
		const tester = new RegExp(`^${tableName}$`, "i");
		const exists = response?.TableNames?.some(name => tester.test(name));
		if (!exists) {
			const command = new CreateTableCommand({
				TableName: tableName,
				AttributeDefinitions: [
					{ AttributeName:"id", AttributeType:"S" }
				],
				KeySchema: [
					{ AttributeName:"id", KeyType:"HASH" }
				],
				ProvisionedThroughput: {
					ReadCapacityUnits: 5,
					WriteCapacityUnits: 5
				}
			});
			await client.send(command);//.catch(errorReturnUndefined);
		}
		return new DdbRepo(tableName);
	}

	/** drops the table if it exists ... DEBUG / TEST ONLY */
	public static async drop(tableName: string): Promise<boolean> {
		const client = DdbRepo.getClient();
		const command = new ListTablesCommand({});
		const response = await client.send(command);//.catch(errorReturnUndefined);
		const tester = new RegExp(`^${tableName}$`, "i");
		const TableName = response?.TableNames?.find(name => tester.test(name));
		if (TableName) {
			const command = new DeleteTableCommand({ TableName });
			const response = await client.send(command);//.catch(errorReturnUndefined);
			return response.$metadata.httpStatusCode === 200;
		}
		return false;
	}

	public static readonly BatchGetMaxItemCount = 100;
	public static readonly BatchPutMaxItemCount = 25;
	public static readonly MaxItemByteSize = 400 * 1024;
}