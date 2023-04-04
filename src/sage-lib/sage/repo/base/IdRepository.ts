import type { Optional, OrNull } from "../../../../sage-utils";
import type { HasIdCore, IdCore } from "../../../../sage-utils/ClassUtils";
import { errorReturnEmptyArray, errorReturnFalse, errorReturnNull } from "../../../../sage-utils/ConsoleUtils";
import { deleteFileSync, fileExistsSync, listFiles, readJsonFile, writeFile } from "../../../../sage-utils/FsUtils";
import { UUID, generate } from "../../../../sage-utils/UuidUtils";
import type { SageCache } from "../../model/SageCache";

type TParser<T extends IdCore, U extends HasIdCore<T>> = (core: T, sageCache: SageCache) => Promise<U>;

/** Represents a repository of HasIdCore objects. */
export abstract class IdRepository<T extends IdCore, U extends HasIdCore<T>> {

	//#region Cache

	private idToEntityMap = new Map<string, U>();

	/** Caches the given id/entity pair. */
	protected cacheId<ID extends string = UUID>(id: ID, entity: U): void {
		if (id && entity) {
			this.idToEntityMap.set(id, entity);
		}
	}

	//#endregion

	/** Lowercase of Repo.objectTypePlural to avoid lowercasing it multiple times. */
	protected objectTypePlural: string;

	public constructor(protected sageCache: SageCache) {
		this.objectTypePlural = (<typeof IdRepository>this.constructor).objectTypePlural.toLowerCase();
	}

	//#region Cores

	private async getAllFileIds(): Promise<string[]> {
		const files = await listFiles(`${IdRepository.DataPath}/${this.objectTypePlural}`, "json")
			.catch<string[]>(errorReturnEmptyArray);
		const fileIds = files.map(file => file.slice(0, -5));
		return fileIds;
	}

	protected async findUncachedCore(predicate: (core: T) => unknown): Promise<T | undefined> {
		const fileIds = await this.getAllFileIds();
		for (const fileId of fileIds) {
			if (!this.idToEntityMap.has(fileId)) {
				const core = await this.readCoreById(fileId);
				if (core && predicate(core)) {
					return core;
				}
			}
		}
		return undefined;
	}

	/** Reads the uuid.json for the given "Id". */
	protected async readCoreById<ID extends string = UUID>(id: ID): Promise<OrNull<T>> {
		const path = `${IdRepository.DataPath}/${this.objectTypePlural}/${id}.json`;
		if (fileExistsSync(path)) {
			return readJsonFile<T>(path).catch(errorReturnNull);
		}
		return null;
	}

	//#endregion

	//#region Entities

	/** Gets all of the entities, checking cache first. */
	public async getAll(): Promise<U[]> {
		const entities: U[] = [];
		const fileIds = await this.getAllFileIds();
		for (const fileId of fileIds) {
			const entity = this.idToEntityMap.has(fileId)
				? this.idToEntityMap.get(fileId)
				: await this.parseAndCache(await this.readCoreById(fileId));
			if (entity) {
				entities.push(entity);
			}
		}
		return entities;
	}

	/** Gets the entity by id, checking cache first. */
	public async getById<ID extends string = UUID>(id: Optional<ID>): Promise<OrNull<U>> {
		if (!id) {
			return null;
		}
		if (this.idToEntityMap.has(id)) {
			return this.idToEntityMap.get(id) ?? null;
		}
		// return this.readById(id);
		const core = await this.readCoreById(id)
			?? await this.findUncachedCore(core => core.id === id);
		return this.parseAndCache(core);
	}

	/** Parses the entity from the core, caching the value before returning it. */
	protected async parseAndCache(core: Optional<T>): Promise<OrNull<U>> {
		if (core) {
			const entity = <U>await (<typeof IdRepository>this.constructor).fromCore(core, this.sageCache);
			this.cacheId(core.id, entity);
			return entity;
		}
		return null;
	}

	/** Writes the entity's core to uuid.json using (or creating if needed) the "Id". */
	public async write(entity: U): Promise<boolean> {
		return this.writeBy(entity, "id");
	}
	protected async writeBy(entity: U, idKey: keyof U): Promise<boolean> {
		const json = entity.toJSON();
		if (!entity.id) {
			json.id = generate();
			console.log(`IdRepository.write: ${(<typeof IdRepository>this.constructor).objectType}`, json);
		}
		const idValue = entity[idKey] ?? entity.id;
		const path = `${IdRepository.DataPath}/${this.objectTypePlural}/${idValue}.json`,
			saved = await writeFile(path, json).catch(errorReturnFalse);
		if (saved) {
			this.cacheId(entity.id, entity);
			if (idKey !== "id") {
				const idPath = `${IdRepository.DataPath}/${this.objectTypePlural}/${entity.id}.json`;
				deleteFileSync(idPath);
			}
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
	public static DataPath = "./data/sage";
}