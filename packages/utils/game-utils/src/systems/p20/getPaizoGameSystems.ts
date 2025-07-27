import { GameSystemType, getGameSystems, type GameSystem } from "../GameSystem.js";

export type PaizoGameSystem = GameSystem & {
	isPf: boolean;
	isSf: boolean;
	is1e: boolean;
	is2e: boolean;
};

export function isPathfinder(gameSystemType: GameSystemType): boolean {
	return gameSystemType === GameSystemType.PF1e
		|| gameSystemType === GameSystemType.PF2e;
}

export function isStarfinder(gameSystemType: GameSystemType): boolean {
	return gameSystemType === GameSystemType.SF1e
		|| gameSystemType === GameSystemType.SF2e;
}

export function is1e(gameSystemType: GameSystemType): boolean {
	return gameSystemType === GameSystemType.PF1e
		|| gameSystemType === GameSystemType.SF1e;
}

export function is2e(gameSystemType: GameSystemType): boolean {
	return gameSystemType === GameSystemType.PF2e
		|| gameSystemType === GameSystemType.SF2e;
}

export function getPaizoGameSystems(): PaizoGameSystem[] {
	return getGameSystems()
		.filter(gameSystem => isPathfinder(gameSystem.type) || isStarfinder(gameSystem.type))
		.map(gameSystem => {
		return {
			...gameSystem,
			isPf: isPathfinder(gameSystem.type),
			isSf: isStarfinder(gameSystem.type),
			is1e: is1e(gameSystem.type),
			is2e: is2e(gameSystem.type)
		};
	});
}