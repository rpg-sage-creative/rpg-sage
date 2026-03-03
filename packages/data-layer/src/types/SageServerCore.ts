import type { Snowflake, UUID } from "@rsc-utils/core-utils";
import { isNonNilSnowflake, isNotBlank } from "@rsc-utils/core-utils";
import { assertArray, assertNumber, assertSageCore, assertString, deleteInvalidString, ensureArray, ensureIds, isMacroBase, optional, type EnsureContext } from "../validation/index.js";
import { GameCreatorType, isAdminRole, isAdminUser, isEmbedColor, isEmoji, type AdminRole, type AdminUser, type HasEmbedColors, type HasEmoji } from "./enums/index.js";
import type { MacroBase, SageCore } from "./index.js";
import { assertSageChannel, ensureSageChannel, type SageChannel, type SageChannelOld } from "./SageChannel.js";
import { assertSageCharacterCore, ensureSageCharacterCore, type SageCharacterCore, type SageCharacterCoreOld } from "./SageCharacterCore.js";
import { assertServerOptions, ensureServerOptions, ServerOptionsKeys, type ServerOptions, type ServerOptionsOld } from "./ServerOptions.js";

export type SageServerCoreAny = SageServerCore | SageServerCoreOld;

export type SageServerCoreOld = Omit<SageServerCore, "channels" | "gmCharacter"> & ServerOptionsOld & {
	channels: SageChannelOld[];
	/** @deprecated */
	games?: unknown;
	gmCharacter?: SageCharacterCoreOld;
	id: string;
	/** @deprecated */
	logLevel?: unknown;
	/** @deprecated */
	nickName?: unknown;
};

export type SageServerCore = SageCore<"Server", Snowflake | UUID> & HasEmbedColors & HasEmoji & ServerOptions & {

	/** explicit list of users to admin sage/games */
	admins: AdminUser[];

	/** all non-game channel configurations */
	channels: SageChannel[];

	/** "sage!" by default */
	commandPrefix?: string;

	// did

	/** "Admin" by default */
	gameCreatorType?: GameCreatorType;

	/** this is/was intended to reference a server wide game */
	gameId?: string;

	/** server level gm character for shared stats/npcs and non-game usage */
	gmCharacter?: SageCharacterCore;

	// id

	/** server level macros */
	macros?: MacroBase[];

	/** stores the name of the server the last time an update was made */
	name: string;

	// objectType

	/** used to allow users to admin sage/games via role instead of .admins */
	roles: AdminRole[];

	// uuid

	// ver

};

export const SageServerKeys: (keyof SageServerCore)[] = [
	...ServerOptionsKeys,
	"admins",
	"channels",
	"colors",
	"commandPrefix",
	"did",
	"emoji",
	"gameCreatorType",
	// "gameId",
	"gmCharacter",
	"id",
	"macros",
	"name",
	"objectType",
	"roles",
	"uuid",
];

const objectType = "Server";
export function assertSageServerCore(core: unknown): core is SageServerCore {
	if (!assertSageCore<SageServerCore>(core, objectType, SageServerKeys)) return false;

	if (!assertServerOptions({ core, objectType })) return false;

	if (!assertArray({ core, objectType, key:"admins", optional, validator:isAdminUser })) return false;
	if (!assertArray({ core, objectType, key:"channels", optional, asserter:assertSageChannel })) return false;
	if (!assertArray({ core, objectType, key:"colors", optional, validator:isEmbedColor })) return false;
	if (!assertString({ core, objectType, key:"commandPrefix", optional })) return false;
	// did --> this needs to become an invalid key
	if (!assertArray({ core, objectType, key:"emoji", optional, validator:isEmoji })) return false;
	if (!assertNumber({ core, objectType, key:"gameCreatorType", optional, validator:GameCreatorType })) return false;
	if (!assertString({ core, objectType, key:"gameId", optional, validator:isNonNilSnowflake })) return false;
	if ("gmCharacter" in core && !assertSageCharacterCore(core.gmCharacter)) return false;
	// id
	if (!assertArray({ core, objectType, key:"macros", optional, validator:isMacroBase })) return false;
	if (!assertString({ core, objectType, key:"name", optional, validator:isNotBlank })) return false;
	// objectType
	if (!assertArray({ core, objectType, key:"roles", optional, validator:isAdminRole })) return false;
	// uuid --> this needs to become an invalid key

	return true;
}

export function ensureSageServerCore(core: SageServerCoreOld, context?: EnsureContext): SageServerCore {
	ensureIds(core);

	ensureServerOptions(core);

	ensureArray({ core, key:"channels", handler:ensureSageChannel, optional , context:{ ...context, serverId:core.id as Snowflake }});
	core.gmCharacter ? core.gmCharacter = ensureSageCharacterCore(core.gmCharacter, { ...context, characterType:"gm" }) as SageCharacterCoreOld : delete core.gmCharacter;
	deleteInvalidString({ core, key:"name" });

	delete core.games;
	delete core.logLevel;
	delete core.nickName;

	return core;
}