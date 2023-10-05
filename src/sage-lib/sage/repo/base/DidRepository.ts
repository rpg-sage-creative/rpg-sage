import type * as Discord from "discord.js";
import type { Optional, UUID } from "../../../../sage-utils";
import { IdCore } from "../../../../sage-utils/utils/ClassUtils";
import IdRepository, { HasIdCoreAndSageCache } from "./IdRepository";

export interface DidCore<T extends string = string> extends IdCore<T> {
	did: Discord.Snowflake;
}

export class HasDidCore<T extends DidCore<U>, U extends string = string> extends HasIdCoreAndSageCache<T, U> {
	public get did(): Discord.Snowflake { return this.core.did; }
}

export default abstract class DidRepository<T extends DidCore, U extends HasDidCore<T>> extends IdRepository<T, U> {

	//#region Cache

	private didToIdMap = new Map<Discord.Snowflake, UUID>();

	/** Overrides the parent .cacheId() to also cache the did/id pair. */
	protected cacheId(id: Discord.Snowflake, entity: U): void {
		super.cacheId(id, entity);
		if (entity) {
			this.cacheDid(entity.did, entity.id);
		}
	}

	/** Caches the given did/id pair. */
	protected cacheDid(did: Discord.Snowflake, id: UUID | undefined): void {
		if (did) {
			this.didToIdMap.set(did, id!);
		}
	}

	//#endregion

	//#region Dids

	/** Reads all of the cores (by iterating all uuid.json files) and returns all the "Did" values. */
	public async getDids(): Promise<Discord.Snowflake[]> {
		const dids = Array.from(this.didToIdMap.keys()),
			cores = await this.readUncachedCores();
		cores.forEach(core => {
			this.cacheDid(core.did, core.id);
			dids.push(core.did);
		});
		return dids;
	}

	//#endregion

	//#region Entities

	/** Gets the entity by did, checking cache first, then .readByDid(), then .readFromUncached(). */
	public async getByDid(did: Optional<Discord.Snowflake>): Promise<U | null> {
		if (!did) {
			return null;
		}
		if (!this.didToIdMap.has(did)) {
			let entity: U | null = this.cached.find(_entity => _entity.did === did) ?? null;
			if (!entity) {
				entity = await this.readFromUncached(did);
			}
			this.cacheDid(did, entity?.id);
			return entity;
		}
		return this.getById(this.didToIdMap.get(did));
	}

	/** Gets the entity using .readUncachedCores() to get the id, caching the value before returning it. */
	private async readFromUncached(did: Discord.Snowflake): Promise<U | null> {
		// Iterate the existing id.json files
		const cores = await this.readUncachedCores(),
			uncached = cores.find(core => core.did === did),
			id = uncached?.id;
		return this.getById(id);
	}

}
