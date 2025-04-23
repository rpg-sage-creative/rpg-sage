import { EphemeralMap, getDataRoot, HasIdCore, type IdCore, type Optional, type OrNull, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import type { SageCache } from "../../model/SageCache.js";
import { globalCacheGet, globalCachePut, globalCacheRead } from "./globalCache.js";

export { DialogPostType as DialogType, type SageChannel as IChannel } from "@rsc-sage/types";

export class HasIdCoreAndSageCache<T extends IdCore<U>, U extends string = string> extends HasIdCore<T, U> {
	public constructor(core: T, public sageCache: SageCache) { super(core); }
}

type IdType = Snowflake | UUID;

type TParser<T extends IdCore, U extends HasIdCore<T>> = (core: T, sageCache: SageCache) => Promise<U>;

export abstract class IdRepository<T extends IdCore, U extends HasIdCore<T>> {

	//#region Cache

	private idToEntityMap = new EphemeralMap<string, U>(15000);

	/** Caches the given id/entity pair. */
	protected cacheId(entity: U): void {
		if (entity) {
			const { id, did, uuid } = entity.toJSON();
			if (id) this.idToEntityMap.set(id, entity);
			if (did) this.idToEntityMap.set(did, entity);
			if (uuid) this.idToEntityMap.set(uuid, entity);
		}
	}

	/** Returns the cached values. */
	protected get cached(): U[] {
		return Array.from(this.idToEntityMap.values());
	}

	public clear(): void {
		this.idToEntityMap.clear();
	}

	//#endregion

	/** Lowercase of Repo.objectTypePlural to avoid lowercasing it multiple times. */
	protected objectTypePlural: string;

	public constructor(protected sageCache: SageCache) {
		this.objectTypePlural = (<typeof IdRepository>this.constructor).objectTypePlural.toLowerCase();
	}

	//#region Entities

	/** Gets the entity by id, checking cache first. */
	public async getById(id: Optional<IdType>): Promise<OrNull<U>> {
		if (!id) {
			return null;
		}
		if (this.idToEntityMap.has(id)) {
			return this.idToEntityMap.get(id) ?? null;
		}
		return this.readById(id);
	}

	/** Gets the entities by id, checking cache first. */
	public async getByIds(...ids: IdType[]): Promise<OrNull<U>[]> {
		const entities: OrNull<U>[] = [];
		for (const id of ids) {
			entities.push(await this.getById(id));
		}
		return entities;
	}

	/** Gets the entity using .readCoreById(), caching the value before returning it. */
	protected async readById(id: IdType): Promise<OrNull<U>> {
		const cached = globalCacheGet<T>(this.objectTypePlural, id);
		const core = await globalCacheRead<T>(this.objectTypePlural, cached?.id ?? id);
		if (core) {
			const repo = this.constructor as typeof IdRepository;
			const entity = await repo.fromCore(core, this.sageCache) as U;
			this.cacheId(entity);
			return entity;
		}
		return null;
	}

	/** Writes the entity's core to uuid.json using (or creating if needed) the "Id". */
	public async write(entity: U): Promise<boolean> {
		const saved = await globalCachePut(entity.toJSON());
		if (saved) {
			this.cacheId(entity);
		}
		return saved;
	}
	//#endregion

	public static fromCore: TParser<IdCore, HasIdCore<IdCore>>;

	public static get objectType(): string {
		return this.name.replace(/Repo(sitory)?$/, "");
	}
	public static get objectTypePlural(): string {
		return this.objectType + "s";
	}
	public static readonly DataPath = getDataRoot("sage");
}