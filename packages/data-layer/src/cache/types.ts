export type CacheItemObjectType = "Character" | "Dice" | "Game" | "Message" | "Server" | "User";

export type CacheItemDirName = Lowercase<`${CacheItemObjectType}s`>;

/** ddb and file should be the only options when this is done; the others are for testing */
export type DataMode = "both" | "ddb" | "ddb-first" | "file" | "file-first";

/** The most basic form of global in memory cache items. */
export type BaseCacheItem<ObjectType extends CacheItemObjectType = CacheItemObjectType> = {
	/** @deprecated drop after all objects have been updated to point to snowflake ids */
	did?: string;
	id: string;
	objectType: ObjectType;
	updatedTs?: number;
	/** @deprecated drop after all objects have been updated to point to snowflake ids */
	uuid?: string;
};

export type CharacterCacheItem = BaseCacheItem<"Character"> & {
	alias?: string;
	gameId?: string;
	name: string;
	userId?: string;
};

/** The global in memory cache item used for Games. */
export type GameCacheItem = BaseCacheItem<"Game"> & {
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

export function isCacheItemDirName(value: unknown): value is CacheItemDirName {
	return ["characters", "games", "messages", "servers", "users"].includes(value as CacheItemDirName);
}

/** Used when writing data to file system. Converts "User" to "users". */
export function objectTypeToDirName<
	ObjectType extends CacheItemObjectType,
	TableName extends CacheItemDirName,
>(
	objectType: ObjectType,
): TableName {

	return objectType.toLowerCase() + "s" as TableName;

}

/** @todo create an ObjectType -> TableName map in env.json ... this makes it easier to manage different bots for different platforms. */
export function objectTypeToTableName<
	ObjectType extends CacheItemObjectType,
>(
	_objectType: ObjectType,
): string {

	// Ddb was designed for a single table per app (mostly).
	// The only reason to break stuff off would be to move messages (or dice?) to their own.
	// Also, to share characters across platforms, I might want to put characters in their own???
	// Splitting characters into their own table would also require ensuring users have a single/unique "sage id" again ...
	// switch(objectType) {
	// 	// separate table for all dice from all platforms for better stats?
	// 	case "Dice": return "rpg_sage_dice";
	// 	// separate table for all messages from all platforms for better stats?
	// 	case "Message": return "rpg_sage_messages";
	// 	// separate table for all characters from all platforms for better reuse?
	// 	case "Character":
	// 	case "Game":
	// 	case "Server":
	// 	// separate table for all users from all platforms for better global settings?
	// 	case "User":
	// 	default: return "rpg_sage_discord";
	// }
	return "rpg_sage_discord";

}

/** Used when reading data from file system. Converts "users" to "User". */
export function dirNameToObjectType<
	TableName extends CacheItemDirName,
	ObjectType extends CacheItemObjectType,
>(
	tableName: TableName,
): ObjectType {

	return tableName[0].toUpperCase() + tableName.slice(1, -1) as ObjectType;

}