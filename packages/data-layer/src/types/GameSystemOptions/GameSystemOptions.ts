import type { GameSystemType } from "../enums/GameSystem.js";

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