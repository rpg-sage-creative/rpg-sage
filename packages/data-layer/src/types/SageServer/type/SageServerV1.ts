import type { Snowflake, UUID } from "@rsc-utils/core-utils";
import type { SageCore } from "../../other/SageCore.js";
import type { HasEmbedColors } from "../../other/HasColors.js";
import type { HasEmoji } from "../../other/HasEmoji.js";
import type { MacroBase } from "../../other/MacroBase.js";
import type { SageCharacterCoreV1 } from "../../SageCharacter/index.js";
import type { SageChannel } from "@rsc-sage/types";

export enum AdminRoleType { Unknown = 0, GameAdmin = 1, ServerAdmin = 2, SageAdmin = 3 }
export type IAdminRole = { did: Snowflake; type: AdminRoleType; }
export type IAdminUser = { did: Snowflake; role: AdminRoleType; }
export enum GameCreatorType { Admin = 0, Any = 1, None = 2 }

export type SageServerCoreV1 = SageCore<"Server", Snowflake | UUID> & HasEmbedColors & HasEmoji & {
	admins: IAdminUser[];
	channels: SageChannel[];
	commandPrefix?: string;
	gameId?: string;
	gmCharacter?: SageCharacterCoreV1;
	name: string;
	roles: IAdminRole[];
	macros?: MacroBase[];
	gameCreatorType?: GameCreatorType;
}

/*
export interface ServerCore extends IdCore<"Server">, IHasColors, IHasEmoji, Partial<ServerOptions> {
	admins: IAdminUser[];
	channels: SageChannel[];
	commandPrefix?: string;
	gameId?: string;
	gmCharacter?: GameCharacter | GameCharacterCore;
	name: string;
	roles: IAdminRole[];
	macros?: MacroBase[];
	/-** defaults to "Admin" *-/
	gameCreatorType?: GameCreatorType;
}
*/