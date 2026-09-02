import { assertNumber, optional, renameProperty } from "../validation/index.js";
import { GameSystemType } from "./enums/GameSystem.js";

export type GameSystemOptionsAny = GameSystemOptionsOld | GameSystemOptions;

export type GameSystemOptionsOld = GameSystemOptions & {
	/** @deprecated */
	defaultGame?: number;
	/** @deprecated */
	defaultGameType?: number;
	/** @deprecated */
	gameType?: number;
};

export type GameSystemOptions = {
	gameSystemType?: GameSystemType;
};

export const GameSystemOptionsKeys: (keyof GameSystemOptions)[] = [
	"gameSystemType",
];

/** gameSystemType */
export function assertGameSystemOptions({ core, objectType }: { core:GameSystemOptionsAny; objectType:string; }): boolean {

	if (!assertNumber({ core, objectType, key:"gameSystemType", optional, validator:GameSystemType })) return false;

	return true;
}

export function ensureGameSystemOptions(core: GameSystemOptionsOld): GameSystemOptions {

	renameProperty({ core, oldKey:"defaultGame", newKey:"gameSystemType" });
	renameProperty({ core, oldKey:"defaultGameType", newKey:"gameSystemType" });
	renameProperty({ core, oldKey:"gameType", newKey:"gameSystemType" });

	return core;
}