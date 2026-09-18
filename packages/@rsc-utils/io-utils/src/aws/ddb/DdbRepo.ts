import { CreateTableCommand, DeleteTableCommand, DynamoDB, ListTablesCommand, UpdateTimeToLiveCommand, type CreateTableCommandInput, type CreateTableCommandOutput, type DeleteTableCommandOutput, type ScanCommandInput, type ScanCommandOutput, type UpdateTimeToLiveCommandInput, type UpdateTimeToLiveCommandOutput } from "@aws-sdk/client-dynamodb";
import { errorReturnUndefined, noop, type Awaitable } from "@rsc-utils/core-utils";
import type { VALID_URL } from "../../url/types.js";
import type { AwsRegion } from "../AwsRegion.js";
import type { DdbClientConfig } from "./DdbClientConfig.js";
import { DdbTable } from "./DdbTable.js";
import { deserializeObject } from "./internal/deserialize.js";
import { processInBatches } from "./internal/processInBatches.js";
import type { BatchGetResults, BatchWriteResults, RepoId, RepoItem, TableNameParser } from "./types.js";

/*
 * 400 KB max json size in DDB
 */

type DDbRepoOptions = {
	batchGetMaxItemCount?: number;
	batchPutMaxItemCount?: number;
	tableNameParser?: TableNameParser;
};

export class DdbRepo<
	Id extends RepoId = RepoId,
	Item extends RepoItem<Id> = RepoItem<Id>,
> {

	private client?: DynamoDB;

	public readonly batchGetMaxItemCount: number;
	public readonly batchPutMaxItemCount: number;
	public readonly tableNameParser: TableNameParser;

	public constructor(public config: DdbClientConfig, options?: DDbRepoOptions) {
		const batchGetMaxItemCount = options?.batchGetMaxItemCount ?? DdbRepo.BatchGetMaxItemCount;
		this.batchGetMaxItemCount = Math.max(0, Math.min(batchGetMaxItemCount, DdbRepo.BatchGetMaxItemCount));

		const batchPutMaxItemCount = options?.batchPutMaxItemCount ?? DdbRepo.BatchPutMaxItemCount
		this.batchPutMaxItemCount = Math.max(0, Math.min(batchPutMaxItemCount, DdbRepo.BatchPutMaxItemCount));

		this.tableNameParser = options?.tableNameParser ?? DdbRepo.TableNameParser;
	}

	public async createTable(createTableArgs: CreateTableCommandInput): Promise<boolean>;
	public async createTable(createTableArgs: CreateTableCommandInput, updateTableArgs: UpdateTimeToLiveCommandInput): Promise<boolean>;
	public async createTable(createTableArgs: CreateTableCommandInput, returnOutput: true): Promise<CreateTableCommandOutput>;
	public async createTable(createTableArgs: CreateTableCommandInput, updateTableArgs: UpdateTimeToLiveCommandInput, returnOutput: true): Promise<{ create:CreateTableCommandOutput; update:UpdateTimeToLiveCommandOutput; }>;
	public async createTable(...args: (CreateTableCommandInput | UpdateTimeToLiveCommandInput | true)[]) {
		const createTableArgs = args.shift() as CreateTableCommandInput;
		const returnOutput = args[0] === true ? args.shift() as true : false;
		const updateTableArgs = args.shift() as UpdateTimeToLiveCommandInput | undefined;

		const client = this.getClient();

		const createCommand = new CreateTableCommand(createTableArgs);
		const createOutput = await client.send(createCommand).catch(errorReturnUndefined);
		const created = createOutput?.$metadata.httpStatusCode === 200
			&& createOutput?.TableDescription?.TableName === createTableArgs.TableName;

		// failed to create, no need to run update
		if (!created) {
			if (!returnOutput) return false;
			if (updateTableArgs) {
				return { create:createOutput };
			}
			return createOutput;
		}

		// no ttl args, no need to run update
		if (!updateTableArgs) {
			return returnOutput
				? createOutput
				: true;
		}

		const updateCommand = new UpdateTimeToLiveCommand(updateTableArgs);
		const updateOutput = await client.send(updateCommand).catch(errorReturnUndefined);
		const updated = updateOutput?.$metadata.httpStatusCode === 200
			&& updateOutput.TimeToLiveSpecification?.AttributeName === updateTableArgs.TimeToLiveSpecification?.AttributeName
			&& updateOutput.TimeToLiveSpecification?.Enabled === updateTableArgs.TimeToLiveSpecification?.Enabled;

		return returnOutput
			? { create:createOutput, update:updateOutput }
			: updated;
	}

	public destroy(): void {
		this.client?.destroy();
		delete this.client;
	}

	public async dropTable(tableName: string): Promise<boolean>;
	public async dropTable(tableName: string, returnOutput: true): Promise<DeleteTableCommandOutput>;
	public async dropTable(tableName: string, returnOutput?: boolean): Promise<boolean | DeleteTableCommandOutput> {
		const command = new DeleteTableCommand({ TableName:tableName });

		const promise = this.getClient().send(command);
		if (returnOutput) return promise;

		const response = await promise.catch(errorReturnUndefined);
		return response?.$metadata.httpStatusCode === 200;
	}

	/**
	 * Attempts to delete all the given items from their appropriate tables.
	 */
	public async delete(keys: Item[]): Promise<BatchWriteResults<Item>> {
		return processInBatches(this, "Delete", keys) as Promise<BatchWriteResults<Item>>;
	}

	/**
	 * Uses ScanCommandOutput to iterate over every item in the table.
	 * callbackfn array will always be an empty array.
	 *
	 * @param callbackfn
	 * @param thisArg
	 * @returns
	 */
	public async forEachAsync<T extends Item = Item>(tableName: string, callbackfn: (value: T, index: number, array: T[]) => Awaitable<unknown>, thisArg?: any): Promise<void> {
		const scanArgs: ScanCommandInput = {
			ExclusiveStartKey: undefined,
			TableName: tableName,
		};

		let index = -1;
		const array: T[] = [];

		const client = this.getClient();
		let results: ScanCommandOutput | undefined;
		do {

			// store anything we catch
			let err: unknown;
			results = await client.scan(scanArgs).catch(reason => { err = reason; return undefined; });

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

			scanArgs.ExclusiveStartKey = results.LastEvaluatedKey;

		}while(results.LastEvaluatedKey !== undefined);

	}

	/**
	 * Uses BatchGetItemCommand to retrieve the items for all the given keys.
	 * If needed, multiple batches will be used.
	 * The fetched results are sorted and returned in the order their keys were given.
	 * Any keys that didnt't get a results are returned as undefined.
	 */
	public async get(keys: Item[]): Promise<BatchGetResults<Item>> {
		return processInBatches(this, "Get", keys);
	}

	/** returns all the items in the table */
	public async getAll<T extends Item = Item>(tableName: string): Promise<T[]> {
		const items: T[] = [];
		/** @todo optimize this by writing proper code vs piggy-backing on forEachAsync */
		await this.forEachAsync<T>(tableName, item => items.push(item));
		return items;
	}

	public getClient(): DynamoDB {
		return this.client ??= DdbRepo.getClient(this.config);
	}

	public async getTableNames(): Promise<string[] | undefined> {
		const command = new ListTablesCommand({});
		const response = await this.getClient().send(command);//.catch(errorReturnUndefined);
		return response?.TableNames;
	}

	public for<
		Id extends RepoId = RepoId,
		Item extends RepoItem<Id> = RepoItem<Id>
	>(
		objectType: string,
	): DdbTable<Id, Item> {
		return new DdbTable(this as DdbRepo<any>, objectType);
	}

	/**
	 * Uses BatchWriteItemCommand to save all the given items.
	 * If needed, multiple batches will be used.
	 * Only unprocessed items are returned.
	 */
	public async save(items: Item[]): Promise<BatchWriteResults<Item>> {
		return processInBatches(this, "Put", items);
	}

	public async testConnection(): Promise<boolean> {
		return DdbRepo.testConnection(this.getClient());
	}

	/** Returns a CreateTableCommandInput with the commonly used settings expected for RPG Sage Creative projects. */
	public static getCreateTableInput(tableName: string): CreateTableCommandInput {
		return {
			TableName: tableName,
			AttributeDefinitions: [
				{ AttributeName:"objectType", AttributeType:"S" },
				{ AttributeName:"id", AttributeType:"S" },
			],
			KeySchema: [
				{ AttributeName:"objectType", KeyType:"HASH" },
				{ AttributeName:"id", KeyType:"RANGE" },
			],
			ProvisionedThroughput: {
				ReadCapacityUnits: 1,
				WriteCapacityUnits: 1
			},
			BillingMode: "PAY_PER_REQUEST",
			StreamSpecification: {
				StreamEnabled: false,
			},
		};
	}

	/** Returns a UpdateTimeToLiveCommandInput with the commonly used settings expected for RPG Sage Creative projects. */
	public static getUpdateTimeToLiveInput(tableName: string): UpdateTimeToLiveCommandInput {
		return {
			TableName: tableName,
			TimeToLiveSpecification: {
				AttributeName: "expireTs",
				Enabled: true,
			},
		};
	}

	/** Returns a DynamoDb object for the given config. If no config is given, then DdbRepo.LocalstackTestConfig is used. */
	public static getClient(config?: DdbClientConfig): DynamoDB {
		const { endpoint, region, ...credentials } = config ?? DdbRepo.DdbClientConfig;
		return new DynamoDB({ credentials, endpoint, region });
	}

	/** Tests that a command can be sent successfully. If no client is given, then a client is created using DdbRepo.LocalstackTestConfig */
	public static async testConnection(client = DdbRepo.getClient()): Promise<boolean> {
		const command = new ListTablesCommand({});
		const response = await client.send(command).catch(noop);
		return response !== undefined;
	}

	public static readonly BatchGetMaxItemCount = 100;

	public static readonly BatchPutMaxItemCount = 25;

	/** Default config to be used by DdbRepo. */
	public static DdbClientConfig: DdbClientConfig = {
		accessKeyId: "ACCESSKEYID",
		endpoint: "http://localhost:8000" as VALID_URL,
		region: "local" as AwsRegion,
		secretAccessKey: "SECRETACCESSKEY",
	};

	public static readonly MaxItemByteSize = 400 * 1024;

	public static readonly TableNameParser: TableNameParser = (objectType: string) => objectType.toLowerCase() + "s";
}
