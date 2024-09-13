import { GameSystemType, getGameSystems, type GameSystem } from "@rsc-sage/types";

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
	const all = getGameSystems();
	return [GameSystemType.PF2e, GameSystemType.SF2e, GameSystemType.PF1e, GameSystemType.SF1e].map(type => {
		const gameSystem  = all.find(system => system.type === type)!;
		return {
			...gameSystem,
			isPf: isPathfinder(type),
			isSf: isStarfinder(type),
			is1e: is1e(type),
			is2e: is2e(type)
		};
	});
}