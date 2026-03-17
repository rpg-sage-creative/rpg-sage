export type CacheItemObjectType = "Character" | "Game" | "Message" | "Server" | "User";

export type CacheItemTableName = Lowercase<`${CacheItemObjectType}s`>;

export type CacheKey = CacheItemObjectType | CacheItemTableName;

/** ddb and file should be the only options when this is done; the others are for testing */
export type DataMode = "both" | "ddb" | "ddb-first" | "file" | "file-first";

/** The most basic form of global in memory cache items. */
export type GlobalCacheItem<ObjectType extends CacheItemObjectType = CacheItemObjectType> = {
	/** @deprecated drop after all objects have been updated to point to snowflake ids */
	did?: string;
	id: string;
	objectType: ObjectType;
	updatedTs?: number;
	/** @deprecated drop after all objects have been updated to point to snowflake ids */
	uuid?: string;
};

export type CharacterCacheItem = GlobalCacheItem<"Character"> & {
	alias?: string;
	gameId?: string;
	name: string;
	userId?: string;
};

/** The global in memory cache item used for Games. */
export type GameCacheItem = GlobalCacheItem<"Game"> & {
	archivedTs?: number;
	channels?: {
		/** @deprecated */
		did?: string;
		id: string;
	}[];
	/** @deprecated */
	serverDid: string;
	serverId: string;
	users?: {
		/** @deprecated */
		did?: string;
		id?: string;
	}[];
};

export function isCacheItemObjectType(value: unknown): value is CacheItemObjectType {
	return ["Character", "Game", "Message", "Server", "User"].includes(value as CacheItemObjectType);
}

export function isCacheItemTableName(value: unknown): value is CacheItemTableName {
	return ["characters", "games", "messages", "servers", "users"].includes(value as CacheItemTableName);
}

export function objectTypeToTableName<
	ObjectType extends CacheItemObjectType,
	TableName extends CacheItemTableName,
>(
	objectType: ObjectType,
): TableName {

	return objectType.toLowerCase() + "s" as TableName;

}

export function tableNameToObjectType<
	TableName extends CacheItemTableName,
	ObjectType extends CacheItemObjectType,
>(
	tableName: TableName,
): ObjectType {

	return tableName[0].toUpperCase() + tableName.slice(1, -1) as ObjectType;

}