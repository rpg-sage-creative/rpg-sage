import type { BatchWriteItemCommandOutput } from "@aws-sdk/client-dynamodb";
import type { RepoItem } from "../types.js";
import { deserializeObject } from "./deserialize.js";

export function collectUnprocessedItems<Item extends RepoItem>(output?: BatchWriteItemCommandOutput): Item[] {
	const unprocessed: Item[] = [];

	if (output?.UnprocessedItems) {

		Object.values(output.UnprocessedItems).forEach(writeRequests => {

			writeRequests.forEach(({ DeleteRequest, PutRequest }) => {

				if (DeleteRequest) {
					unprocessed.push(deserializeObject(DeleteRequest!.Key!));
				}

				if (PutRequest) {
					unprocessed.push(deserializeObject(PutRequest!.Item!));
				}

			});

		});
	}

	return unprocessed;
}