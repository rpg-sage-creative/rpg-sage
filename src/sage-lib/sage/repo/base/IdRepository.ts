import { HasIdCore, type IdCore } from "@rsc-utils/class-utils";
import { EphemeralMap, errorReturnEmptyArray, errorReturnFalse, errorReturnNull, getCodeName, getDataRoot, isDefined, isNonNilSnowflake, isNonNilUuid, randomSnowflake, verbose, type Optional, type OrNull, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { listFiles, readJsonFile, writeFile } from "@rsc-utils/io-utils";
import type { SageCache } from "../../model/SageCache.js";

export { DialogPostType as DialogType, type SageChannel as IChannel } from "@rsc-sage/types";

export class HasIdCoreAndSageCache<T extends IdCore<U>, U extends string = string> extends HasIdCore<T, U> {
	public constructor(core: T, public sageCache: SageCache) { super(core); }
}

type IdType = Snowflake | UUID;

type TParser<T extends IdCore, U extends HasIdCore<T>> = (core: T, sageCache: SageCache) => Promise<U>;

export abstract class IdRepository<T extends IdCore, U extends HasIdCore<T>> {

	//#region CacheÒ

	private idToEntityMap = new EphemeralMap<IdType, U>(15000);

	/** Caches the given id/entity pair. */
	protected cacheId(id: IdType, entity: U): void {
		if (id && entity) {
			this.idToEntityMap.set(id, entity);
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

	//#region Ids

	/** Reads all the uuid.json files and returns all the "Id" values. */
	protected async getIds(): Promise<IdType[]> {
		const files = await listFiles(`${IdRepository.DataPath}/${this.objectTypePlural}`)
			.catch<string[]>(errorReturnEmptyArray);
		return files
			.filter(file => file.endsWith(".json"))
			.map(file => file.slice(0, -5))
			.filter(id => isNonNilUuid(id) || isNonNilSnowflake(id)) as IdType[];
	}

	//#endregion

	//#region Cores

	/** Reads all uncached cores by iterating all uuid.json files and checking cache. */
	protected async readUncachedCores(): Promise<T[]> {
		const ids = await this.getIds(),
			uncachedIds = ids.filter(id => !this.idToEntityMap.has(id)),
			cores = await this.readCoresByIds(...uncachedIds);
		return cores.filter(isDefined);
	}

	/** Reads the uuid.json for the given "Id". */
	protected readCoreById(id: IdType): Promise<OrNull<T>> {
		return readJsonFile<T>(`${IdRepository.DataPath}/${this.objectTypePlural}/${id}.json`)
			.catch(errorReturnNull);
	}

	/** Reads the uuid.json for each given "Id". */
	protected async readCoresByIds(...ids: IdType[]): Promise<OrNull<T>[]> {
		const cores: OrNull<T>[] = [];
		for (const id of ids) {
			cores.push(await this.readCoreById(id));
		}
		return cores;
	}

	//#endregion

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
		const core = await this.readCoreById(id);
		if (core) {
			const entity = <U>await (<typeof IdRepository>this.constructor).fromCore(core, this.sageCache);
			this.cacheId(id, entity);
			return entity;
		}
		return null;
	}

	/** Writes the entity's core to uuid.json using (or creating if needed) the "Id". */
	public async write(entity: U): Promise<boolean> {
		if (!entity.id) {
			entity.toJSON().id = randomSnowflake();
			verbose(`Missing ${(<typeof IdRepository>this.constructor).objectType}.id:`, entity.toJSON());
		}

		const path = `${IdRepository.DataPath}/${this.objectTypePlural}/${entity.id}.json`;
		const formatted = getCodeName() === "dev";
		const saved = await writeFile(path, entity.toJSON(), true, formatted).catch(errorReturnFalse);
		if (saved) {
			this.cacheId(entity.id as IdType, entity);
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