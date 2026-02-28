import { isNonNilSnowflake, type Snowflake } from "@rsc-utils/core-utils";
import { isSimpleObject } from "../../validation/index.js";

export enum GameRoleType { Unknown = 0, Spectator = 1, Player = 2, GameMaster = 3, Cast = 4, Table = 5 }

export type GameRoleData = {
	did: Snowflake;
	type: GameRoleType;
	/** "off" (false) by default */
	dicePing?: boolean;
};

export function isGameRoleData(core: unknown): core is GameRoleData {
	return isSimpleObject<GameRoleData>(core)
		&& (core.dicePing === undefined || typeof(core.dicePing) === "boolean")
		&& isNonNilSnowflake(core.did)
		&& typeof(core.type) === "number"
		&& core.type in GameRoleType;
}
