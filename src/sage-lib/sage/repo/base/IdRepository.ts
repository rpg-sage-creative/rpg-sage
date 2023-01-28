import type * as Discord from "discord.js";
import type { GameType } from "../../../../sage-common";
import type { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../../sage-dice";
import utils, { IdCore, Optional, OrNull, UUID } from "../../../../sage-utils";
import type { DicePostType } from "../../commands/dice";
import type SageCache from "../../model/SageCache";

export type TPermissionType = keyof typeof PermissionType;
export enum PermissionType { None = 0, Read = 1, React = 2, Write = 3 }
export type TDialogType = keyof typeof DialogType;
export enum DialogType { Embed = 0, Post = 1 }
export interface IChannelOptions {
	// Features
	admin?: boolean;
	commands?: boolean;
	dialog?: boolean;
	dice?: boolean;
	search?: boolean;

	// Access
	gameMaster?: PermissionType;
	player?: PermissionType;
	nonPlayer?: PermissionType;

	//Defaults
	defaultDialogType?: DialogType;
	defaultCritMethodType?: CritMethodType;
	defaultDicePostType?: DicePostType;
	defaultDiceOutputType?: DiceOutputType;
	defaultDiceSecretMethodType?: DiceSecretMethodType;
	defaultGameType?: GameType;

	// Future Use
	sendCommandTo?: Discord.Snowflake;
	sendDialogTo?: Discord.Snowflake;
	sendDiceTo?: Discord.Snowflake;
	sendSearchTo?: Discord.Snowflake;
}
export interface IChannel extends IChannelOptions {
	did: Discord.Snowflake;
}

type IChannelKey = keyof IChannel;
type IChannelOptionsKey = keyof IChannelOptions;
export function updateChannel(channel: IChannel, changes: IChannelOptions): IChannel {
	Object.keys(changes).forEach(key => {
		if (changes[<IChannelOptionsKey>key] !== undefined) {
			(<any>channel[<IChannelKey>key]) = changes[<IChannelOptionsKey>key];
		}
	});
	return channel;
}

export class HasIdCoreAndSageCache<T extends IdCore<U>, U extends string = string> extends utils.ClassUtils.HasIdCore<T, U> {
	public constructor(core: T, protected sageCache: SageCache) { super(core); }
}

type TParser<T extends IdCore, U extends utils.ClassUtils.HasIdCore<T>> = (core: T, sageCache: SageCache) => Promise<U>;

export default abstract class IdRepository<T extends IdCore, U extends utils.ClassUtils.HasIdCore<T>> {

	//#region Cache

	private idToEntityMap = new Map<UUID, U>();

	/** Caches the given id/entity pair. */
	protected cacheId(id: UUID, entity: U): void {
		if (id && entity) {
			this.idToEntityMap.set(id, entity);
		}
	}

	/** Returns the cached values. */
	protected get cached(): U[] {
		return Array.from(this.idToEntityMap.values());
	}

	//#endregion

	/** Lowercase of Repo.objectTypePlural to avoid lowercasing it multiple times. */
	protected objectTypePlural: string;

	public constructor(protected sageCache: SageCache) {
		this.objectTypePlural = (<typeof IdRepository>this.constructor).objectTypePlural.toLowerCase();
	}

	//#region Ids

	/** Reads all the uuid.json files and returns all the "Id" values. */
	protected async getIds(): Promise<UUID[]> {
		const files = await utils.FsUtils.listFiles(`${IdRepository.DataPath}/${this.objectTypePlural}`)
			.catch<string[]>(utils.ConsoleUtils.Catchers.errorReturnEmptyArray);
		return files
			.filter(file => file.endsWith(".json"))
			.map(file => file.slice(0, -5))
			.filter(utils.UuidUtils.isValid);
	}

	//#endregion

	//#region Cores

	/** Reads all cores by iterating all uuid.json files. */
	protected async readAllCores(): Promise<T[]> {
		const ids = await this.getIds(),
			cores = await this.readCoresByIds(...ids);
		return cores.filter(utils.ArrayUtils.Filters.exists);
	}

	/** Reads all uncached cores by iterating all uuid.json files and checking cache. */
	protected async readUncachedCores(): Promise<T[]> {
		const ids = await this.getIds(),
			uncachedIds = ids.filter(id => !this.idToEntityMap.has(id)),
			cores = await this.readCoresByIds(...uncachedIds);
		return cores.filter(utils.ArrayUtils.Filters.exists);
	}

	/** Reads the uuid.json for the given "Id". */
	protected readCoreById(id: UUID): Promise<OrNull<T>> {
		return utils.FsUtils
			.readJsonFile<T>(`${IdRepository.DataPath}/${this.objectTypePlural}/${id}.json`)
			.catch(utils.ConsoleUtils.Catchers.errorReturnNull);
	}

	/** Reads the uuid.json for each given "Id". */
	protected async readCoresByIds(...ids: UUID[]): Promise<OrNull<T>[]> {
		const cores: OrNull<T>[] = [];
		for (const id of ids) {
			cores.push(await this.readCoreById(id));
		}
		return cores;
	}

	//#endregion

	//#region Entities

	/** Gets all of the entities by using getIds() and getByIds(), which checks cache first. */
	public async getAll(): Promise<U[]> {
		const ids = await this.getIds(),
			entities = await this.getByIds(...ids);
		return entities.filter(utils.ArrayUtils.Filters.exists);
	}

	/** Gets the entity by id, checking cache first. */
	public async getById(id: Optional<UUID>): Promise<OrNull<U>> {
		if (!id) {
			return null;
		}
		if (this.idToEntityMap.has(id)) {
			return this.idToEntityMap.get(id) ?? null;
		}
		return this.readById(id);
	}

	/** Gets the entities by id, checking cache first. */
	public async getByIds(...ids: UUID[]): Promise<OrNull<U>[]> {
		const entities: OrNull<U>[] = [];
		for (const id of ids) {
			entities.push(await this.getById(id));
		}
		return entities;
	}

	/** Gets the entity using .readCoreById(), caching the value before returning it. */
	protected async readById(id: UUID): Promise<OrNull<U>> {
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
			entity.toJSON().id = utils.UuidUtils.generate();
			console.log(`Creating new ${(<typeof IdRepository>this.constructor).objectType}: `, entity.toJSON());
		}
		const path = `${IdRepository.DataPath}/${this.objectTypePlural}/${entity.id}.json`,
			saved = await utils.FsUtils.writeFile(path, entity.toJSON()).catch(utils.ConsoleUtils.Catchers.errorReturnFalse);
		if (saved) {
			this.cacheId(entity.id, entity);
		}
		return saved;
	}
	//#endregion

	public static fromCore: TParser<IdCore, utils.ClassUtils.HasIdCore<IdCore>>;

	public static get objectType(): string {
		return this.name.replace(/Repo(sitory)?$/, "");
	}
	public static get objectTypePlural(): string {
		return this.objectType + "s";
	}
	public static DataPath = "./data/sage";
}