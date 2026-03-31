import { DataTable, type BaseCacheItem, type CacheItemObjectType } from "@rsc-sage/data-layer";
import { debug, EphemeralMap, error, getDataRoot, isNonNilSnowflake, isNonNilUuid, type Optional, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { Game, type GameCore } from "../../model/Game.js";
import { GameCharacter, type GameCharacterCore } from "../../model/GameCharacter.js";
import type { SageCache } from "../../model/SageCache.js";
import { Server, type ServerCore } from "../../model/Server.js";
import { User, type UserCore } from "../../model/User.js";

type IdType = Snowflake | UUID;

async function entityFromCore(sageCache: SageCache, core: GameCharacterCore): Promise<GameCharacter>;
async function entityFromCore(sageCache: SageCache, core: GameCore): Promise<Game>;
async function entityFromCore(sageCache: SageCache, core: ServerCore): Promise<Server>;
async function entityFromCore(sageCache: SageCache, core: UserCore): Promise<User>;
async function entityFromCore(sageCache: SageCache, core: GameCharacterCore | GameCore | ServerCore | UserCore): Promise<GameCharacter | Game | Server | User>;
async function entityFromCore(sageCache: SageCache, core: GameCharacterCore | GameCore | ServerCore | UserCore) {
	switch(core.objectType) {
		case "Character":
			return undefined as GameCharacter | unknown;
		case "Game":
			const server = await sageCache.getOrFetchServer(core.serverId, core.serverDid);
			if (!server) debug({serverId:core.serverId,serverDid:core.serverDid});
			return new Game(core, server!, sageCache);
		case "Server":
			return new Server(core, sageCache);
		case "User":
			return new User(core, sageCache);
	}
}

type RepoType = CacheItemObjectType;
type RepoCore = GameCore | ServerCore | UserCore;
type RepoEntity = Game | Server | User;

export class IdRepository<
	Type extends RepoType = RepoType,
	Core extends RepoCore = RepoCore,
	Entity extends RepoEntity = RepoEntity
> {

	//#region Cache

	/** @todo cache by objectType to make filtering/searching simpler */
	private idToEntityMap = new EphemeralMap<string, Entity>(15000);

	/** Caches the given id/entity pair. */
	protected cacheId(entity: Entity): void {
		if (entity) {
			const { id, did, uuid } = entity.toJSON();
			if (id) this.idToEntityMap.set(id, entity);
			if (did) this.idToEntityMap.set(did, entity);
			if (uuid) this.idToEntityMap.set(uuid, entity);
		}
	}

	/** Returns the cached values. */
	protected get cached(): Entity[] {
		return Array.from(this.idToEntityMap.values());
	}

	public clear(): void {
		this.idToEntityMap.clear();
	}

	//#endregion

	public constructor(protected sageCache: SageCache) { }

	//#region Entities

	public async find<CacheItem extends BaseCacheItem<Type>>(objectType: Type, tester: (core: CacheItem) => unknown): Promise<Entity | undefined> {
		const entities = this.cached;

		const cachedEntity = entities.find(entity => entity.objectType === objectType && tester(entity.toJSON() as CacheItem));
		if (cachedEntity) return cachedEntity;

		const dataTable = DataTable.for(objectType);
		const uncachedEntity = dataTable?.find(tester);
		const uncachedCore = uncachedEntity ? await dataTable?.fetch(uncachedEntity) : uncachedEntity;
		if (uncachedCore) {
			const entity = await entityFromCore(this.sageCache, uncachedCore as RepoCore);
			this.cacheId(entity as Entity);
			return entity as Entity;
		}

		return undefined;
	}

	/**
	 * Gets the entity by id, checking cache first.
	 * Multiple ids are accepted so that we can more efficiently find things we have multiple ids for (id, did, uuid).
	 * Example: ServerRepo.getById(game.serverId, game.serverDid)
	 * @todo when we consolidate our ids we can remove this multi id option
	 */
	public async getById(objectType: Type, ...ids: Optional<IdType>[]): Promise<Entity | undefined> {
		const validIds = new Set<IdType>();

		// if we have it mapped, use it
		for (const id of ids) {
			const isValidId = isNonNilSnowflake(id) || isNonNilUuid(id);

			// only check a validId that hasn't already been checked
			if (isValidId && !validIds.has(id)) {

				if (this.idToEntityMap.has(id)) {
					return this.idToEntityMap.get(id);
				}

				// id not cached, add to set for readyById
				validIds.add(id);
			}
		}

		debug(`IdRepository.getById("${objectType}", ${ids.join(", ")}): nothing mapped, calling this.readById("${objectType}", ${[...validIds].join(", ")})`);

		// we have to get it from cache or file
		return this.readById(objectType, ...validIds);
	}

	/**
	 * Gets the entity using DataTable.for(objectType).fetch({ objectType, id }), caching the value before returning it.
	 * Multiple ids are accepted so that we can more efficiently find things we have multiple ids for (id, did, uuid).
	 * Example: readById(serverId, serverDid)
	 * @todo when we consolidate our ids we can remove this multi id option
	 */
	protected async readById(objectType: Type, ...ids: IdType[]): Promise<Entity | undefined> {

		/*
		In a world where an item only has 1 id, we only need to use dataTable.fetch(id).
		Because we have id, did, or uuid ... and we don't know which, we have to take extra steps.
		We need to fetch by the id used to write the file, which *should* be id.
		But we aren't always sure that is the id we have.
		While DataTable caching is primarily for quick searches, we can use it for id translation.
		We iterate all the given ids and see if we have an item cached by that id.
		If we do, then we can do a dataTable.fetch of that cached item.
		This fetch internally looks for the full item by checking all three ids (if available).
		If this fetch fails, we know that the cached item's id, did, and uuid don't need to be fetched again.
		*/

		const ret = async (core: Core) => {
			const entity = await entityFromCore(this.sageCache, core) as Entity;
			this.cacheId(entity);
			return entity;
		};

		const dataTable = DataTable.for(objectType);

		// track ids used to fetch so we don't waste time trying them again
		const usedToFetch = new Set<string | undefined>();

		// check the existing in memory cache first
		for (const id of ids) {
			// skip this id was already used to fetch
			if (usedToFetch.has(id)) continue;

			const cached = dataTable?.get(id);
			if (cached) {
				const core = await dataTable?.fetch(cached);
				if (core) {
					return ret(core as Core);
				}

				// fetch failed to find anything
				usedToFetch.add(cached.id);
				usedToFetch.add(cached.did);
				usedToFetch.add(cached.uuid);
			}
		}

		// check the file system directly next
		for (const id of ids) {
			// skip this id was already used to fetch
			if (usedToFetch.has(id)) continue;

			const item = { id, objectType };
			const core = await dataTable?.fetch(item);
			if (core) {
				return ret(core as Core);
			}

			// fetch failed to find anything
			usedToFetch.add(id);
		}

		debug({ ev:`IdRepository.readById(objectType, ...ids): Item Not Found!`, objectType, ids });

		return undefined;
	}

	/** Writes the entity's core to uuid.json using (or creating if needed) the "Id". */
	public async write(entity: Entity): Promise<boolean> {
		const dataTable = DataTable.for(entity.objectType as Type);
		if (!dataTable) {
			error(`IdRepository.write() failed; DataTable missing: ${entity.objectType}`);
			return false;
		}
		const saved = await dataTable?.write(entity.toJSON());
		if (saved) {
			this.cacheId(entity);
		}
		return saved === true;
	}

	//#endregion

	public static readonly DataPath = getDataRoot("sage");
}