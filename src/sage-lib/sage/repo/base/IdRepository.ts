import { debug, EphemeralMap, getDataRoot, isNonNilSnowflake, isNonNilUuid, toLiteral, type Optional, type OrNull, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { Game, type GameCore } from "../../model/Game.js";
import type { SageCache } from "../../model/SageCache.js";
import { Server, type ServerCore } from "../../model/Server.js";
import { User, type UserCore } from "../../model/User.js";
import { globalCacheFind, globalCacheGet, globalCachePut, globalCacheRead, type GameCacheItem } from "./globalCache.js";

export { DialogPostType as DialogType, type SageChannel as IChannel } from "@rsc-sage/types";

type IdType = Snowflake | UUID;

async function entityFromCore(sageCache: SageCache, core: GameCore): Promise<Game>;
async function entityFromCore(sageCache: SageCache, core: ServerCore): Promise<Server>;
async function entityFromCore(sageCache: SageCache, core: UserCore): Promise<User>;
async function entityFromCore(sageCache: SageCache, core: GameCore | ServerCore | UserCore): Promise<Game | Server | User>;
async function entityFromCore(sageCache: SageCache, core: GameCore | ServerCore | UserCore) {
	switch(core.objectType) {
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

type RepoType = "Game" | "Server" | "User";
type RepoCore = GameCore | ServerCore | UserCore;
type RepoEntity = Game | Server | User;
export abstract class IdRepository<Type extends RepoType = RepoType, Core extends RepoCore = RepoCore, Entity extends RepoEntity = RepoEntity> {

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

	public async find(objectType: Type, tester: (core: GameCacheItem) => unknown): Promise<Entity | undefined> {
		const entities = this.cached;

		const cachedEntity = entities.find(entity => entity.objectType === objectType && tester(entity.toJSON() as GameCacheItem));
		if (cachedEntity) return cachedEntity;

		const uncachedEntity = globalCacheFind(objectType, tester);
		const uncachedCore = uncachedEntity ? await globalCacheRead(uncachedEntity) : uncachedEntity;
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
	public async getById(objectType: Type, ...ids: Optional<IdType>[]): Promise<OrNull<Entity>> {
		/** @todo proper filter on snowflake/uuid ? */
		const validIds = ids.filter(s => s) as IdType[];

		// if we have it mapped, use it
		for (const id of validIds) {
			if (this.idToEntityMap.has(id)) {
				return this.idToEntityMap.get(id) ?? null;
			}
		}

		// we have to get it from cache or file
		return this.readById(objectType, ...validIds);
	}

	/** Gets the entities by id, checking cache first. */
	public async getByIds(objectType: Type, ...ids: IdType[]): Promise<OrNull<Entity>[]> {
		const entities: OrNull<Entity>[] = [];
		for (const id of ids) {
			entities.push(await this.getById(objectType, id));
		}
		return entities;
	}

	/**
	 * Gets the entity using .readCoreById(), caching the value before returning it.
	 * Multiple ids are accepted so that we can more efficiently find things we have multiple ids for (id, did, uuid).
	 * Example: readById(serverId, serverDid)
	 * @todo when we consolidate our ids we can remove this multi id option
	 */
	protected async readById(objectType: Type, ...ids: IdType[]): Promise<OrNull<Entity>> {
		const ret = async (core: Core) => {
			const entity = await entityFromCore(this.sageCache, core) as Entity;
			this.cacheId(entity);
			return entity;
		};

		const validIds = ids.filter(id => isNonNilSnowflake(id) || isNonNilUuid(id));

		// check the existing in memory cache first
		for (const id of validIds) {
			const cached = globalCacheGet<Core>(objectType, id);
			if (cached) {
				const core = await globalCacheRead<Core>(cached);
				if (core) return ret(core);
			}
		}

		// check the file system next
		for (const id of validIds) {
			const item = { id, objectType };
			const core = await globalCacheRead<Core>(item);
			if (core) return ret(core);
		}

		debug({ ev:`IdRepository.readById(${toLiteral(ids)}): Item Not Found!`, objectType, ids, validIds });

		return null;
	}

	/** Writes the entity's core to uuid.json using (or creating if needed) the "Id". */
	public async write(entity: Entity): Promise<boolean> {
		const saved = await globalCachePut(entity.toJSON());
		if (saved) {
			this.cacheId(entity);
		}
		return saved;
	}

	//#endregion

	public static readonly DataPath = getDataRoot("sage");
}