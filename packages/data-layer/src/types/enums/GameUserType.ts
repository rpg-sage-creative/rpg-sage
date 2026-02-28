import { isNonNilSnowflake, type Snowflake } from "@rsc-utils/core-utils";
import { isSimpleObject } from "../../validation/index.js";

export enum GameUserType { Unknown = 0, Player = 1, GameMaster = 2 }

export type GameUserData = {
	did: Snowflake;
	type: GameUserType;
	/** "on" (true) by default */
	dicePing?: boolean;
};

export function isGameUserData(core: unknown): core is GameUserData {
	return isSimpleObject<GameUserData>(core)
		&& (core.dicePing === undefined || typeof(core.dicePing) === "boolean")
		&& isNonNilSnowflake(core.did)
		&& typeof(core.type) === "number"
		&& core.type in GameUserType;
}