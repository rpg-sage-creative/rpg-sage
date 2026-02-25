import type { GameSystemType } from "../enums/GameSystem.js";

export type GameSystemOptionsOld = GameSystemOptionsV0;
export type GameSystemOptions = GameSystemOptionsV1;
export type GameSystemOptionsAny = GameSystemOptionsOld | GameSystemOptions;

export type GameSystemOptionsV0 = GameSystemOptionsV1 & {
	/** @deprecated */
	defaultGame?: number;
	/** @deprecated */
	defaultGameType?: number;
	/** @deprecated */
	gameType?: number;
};

export type GameSystemOptionsV1 = {
	gameSystemType?: GameSystemType;
};

export const GameSystemOptionsV1Keys: (keyof GameSystemOptionsV1)[] = [
	"gameSystemType",
];