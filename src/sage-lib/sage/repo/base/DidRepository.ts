import type { Optional } from "@rsc-utils/type-utils";
import { Snowflake, SnowflakeUtil } from "discord.js";
import { existsSync } from "fs";
import type { UUID } from "../../../../sage-utils";
import { EphemeralMap } from "../../../../sage-utils/utils/ArrayUtils/EphemeralMap";
import { IdCore } from "../../../../sage-utils/utils/ClassUtils";
import { errorReturnNull, verbose } from "../../../../sage-utils/utils/ConsoleUtils";
import { readJsonFile, symLinkSync } from "../../../../sage-utils/utils/FsUtils";
import IdRepository, { HasIdCoreAndSageCache } from "./IdRepository";

export interface DidCore<T extends string = string> extends IdCore<T> {
	did: Snowflake;
}

export class HasDidCore<T extends DidCore<U>, U extends string = string> extends HasIdCoreAndSageCache<T, U> {
	public get did(): Snowflake { return this.core.did; }
}

export default abstract class DidRepository<T extends DidCore, U extends HasDidCore<T>> extends IdRepository<T, U> {

	//#region Cache

	private didToIdMap = new EphemeralMap<Snowflake, UUID>(15000);

	/** Overrides the parent .cacheId() to also cache the did/id pair. */
	protected cacheId(id: Snowflake, entity: U): void {
		super.cacheId(id, entity);
		if (entity) {
			this.cacheDid(entity.did, entity.id);
		}
	}

	/** Caches the given did/id pair. */
	protected cacheDid(did: Snowflake, id: UUID | undefined): void {
		if (did) {
			this.didToIdMap.set(did, id!);
		}
	}

	public clear(): void {
		this.didToIdMap.clear();
		super.clear();
	}

	//#endregion

	//#region Dids

	/** Reads all of the cores (by iterating all uuid.json files) and returns all the "Did" values. */
	public async getDids(): Promise<Snowflake[]> {
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
	public async getByDid(did: Optional<Snowflake>): Promise<U | null> {
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
	private async readFromUncached(did: Snowflake): Promise<U | null> {
		// Check for did.json
		const didPath = `${IdRepository.DataPath}/${this.objectTypePlural}/did/${did}.json`;
		if (existsSync(didPath)) {
			const core = await readJsonFile<T>(didPath).catch(errorReturnNull);
			if (core) {
				this.cacheDid(did, core.id);
				const entity = <U>await (<typeof IdRepository>this.constructor).fromCore(core, this.sageCache);
				this.cacheId(core.id, entity);
				return entity;
			}
		}

		// Iterate the existing id.json files
		const cores = await this.readUncachedCores(),
			uncached = cores.find(core => core.did === did),
			id = uncached?.id;
		return this.getById(id);
	}

	/** Writes the entity's core to uuid.json using (or creating if needed) the "Id". */
	public async write(entity: U): Promise<boolean> {
		if (!entity.did) {
			entity.toJSON().did = SnowflakeUtil.generate();
			verbose(`Missing ${(<typeof DidRepository>this.constructor).objectType}.did:`, entity.toJSON());
		}

		const saved = await super.write(entity);
		if (saved) {
			const idPath = `../${entity.id}.json`;
			const didPath = `${IdRepository.DataPath}/${this.objectTypePlural}/did/${entity.did}.json`;
			const linked = symLinkSync(idPath, didPath, { mkdir:true, overwrite:true });
			if (linked) {
				this.cacheDid(entity.did, entity.id);
			}
			return saved && linked;
		}
		return saved;
	}

	//#endregion
}
