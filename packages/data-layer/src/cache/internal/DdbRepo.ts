import type { Optional, Snowflake, UUID } from "@rsc-utils/core-utils";
import { DdbRepo, type DdbTable } from "@rsc-utils/io-utils";
import type { CacheItemTableName } from "../types.js";

let ddbRepo: Optional<DdbRepo>;

export function destroyDdbRepo(): void {
	ddbRepo?.destroy();
	ddbRepo = null;
}

type RepoId = Snowflake | UUID;
type RepoItem<Id extends RepoId = Snowflake> = { id:Id; objectType:string; };

export function getDdbTable<
	Id extends RepoId = RepoId,
	Item extends RepoItem<Id> = RepoItem<Id>,
>(
	tableName: CacheItemTableName,
): DdbTable<Id, Item> {

	ddbRepo ??= new DdbRepo(DdbRepo.DdbClientConfig);
	return ddbRepo.for(tableName);

}