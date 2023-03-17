import { Snowflake, SnowflakeUtil } from "discord.js";
import type { IdCore, Optional } from "../../../../sage-utils";
import IdRepository, { HasIdCoreAndSageCache } from "./IdRepository";

export interface DidCore<T extends string = string> extends IdCore<T> {
	did: Snowflake;
}

export class HasDidCore<T extends DidCore<U>, U extends string = string> extends HasIdCoreAndSageCache<T, U> {
	public get did(): Snowflake { return this.core.did; }
}

export default abstract class DidRepository<T extends DidCore, U extends HasDidCore<T>> extends IdRepository<T, U> {

	//#region Cache

	/** Overrides the parent .cacheId() to also cache the did/id pair. */
	protected cacheId(id: Snowflake, entity: U): void {
		super.cacheId(id, entity);
		const did = entity?.did;
		if (did) {
			super.cacheId(did, entity);
		}
	}

	//#endregion

	//#region Entities

	/** Gets the entity by did, checking cache first, then .readByDid(), then .readFromUncached(). */
	public async getByDid(did: Optional<Snowflake>): Promise<U | null> {
		const entity = await this.getById(did);
		if (entity) {
			return entity;
		}
		const core = await this.findUncachedCore(_core => _core.did === did);
		return this.parseAndCache(core);
	}

	/** Writes the entity's core to did.json using the "Did". */
	public async write(entity: U): Promise<boolean> {
		if (!entity.did) {
			const json = entity.toJSON();
			json.did = SnowflakeUtil.generate().toString();
			console.log(`DidRepository.write: ${(<typeof IdRepository>this.constructor).objectType}`, json);
		}
		return this.writeBy(entity, "did");
	}

}
