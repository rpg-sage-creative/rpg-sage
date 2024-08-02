export enum GameSystemType {
	None = 0,
	/** Pathfinder 1e */
	PF1e = 11,
	/** Pathfinder 2e */
	PF2e = 12,
	/** Starfinder 1e */
	SF1e = 21,
	/** Starfinder 2e */
	SF2e = 22,
	/** Coyote & Crow */
	CnC = 31,
	/** Essence 20 */
	E20 = 41,
	/** Dungeons and Dragons 5e */
	DnD5e = 55,
	/** Quest */
	Quest = 71,
	/** Vampire: The Masquerade 5e */
	VtM5e = 85
}

export { GameSystemType as GameType };

export type GameSystemCode = keyof typeof GameSystemType;

export type DiceSystemCode = GameSystemCode;

export type GameSystem = {
	/** Short code for the game system */
	code: GameSystemCode;
	/** Description of the game. */
	description: string;
	/** Which dice system does the game use */
	dice: DiceSystemCode;
	/** Name of the game. */
	name: string;
	/** Numeric enum value for the game system */
	type: GameSystemType;
};

const gameSystems: GameSystem[] = [
	{ code:"None", description:"No Game System.", dice:"None", name:"None", type:GameSystemType.None },
	{ code:"CnC", description:"", dice:"CnC", name:"Coyote & Crow", type:GameSystemType.CnC },
	{ code:"DnD5e", description:"", dice:"DnD5e", name:"Dungeons & Dragons 5e", type:GameSystemType.DnD5e },
	{ code:"E20", description:"", dice:"E20", name:"Essence 20", type:GameSystemType.E20 },
	{ code:"PF1e", description:"", dice:"PF1e", name:"Pathfinder 1e", type:GameSystemType.PF1e },
	{ code:"PF2e", description:"", dice:"PF2e", name:"Pathfinder 2e", type:GameSystemType.PF2e },
	{ code:"Quest", description:"", dice:"Quest", name:"Quest RPG", type:GameSystemType.Quest },
	{ code:"SF1e", description:"", dice:"SF1e", name:"Starfinder 1e", type:GameSystemType.SF1e },
	{ code:"SF2e", description:"", dice:"SF2e", name:"Starfinder 2e", type:GameSystemType.SF2e },
	{ code:"VtM5e", description:"", dice:"VtM5e", name:"Vampire: the Masquerade 5e", type:GameSystemType.VtM5e },
];

export function getGameSystems(): GameSystem[] {
	return gameSystems;
}

/** Returns a game system if found, undefined otherwise. */
export function parseGameSystem(value?: string | number | null): GameSystem | undefined {
	if (value) {
		if (typeof(value) === "number") {
			return gameSystems.find(system => system.type === value);
		}else {
			const regex = new RegExp(`^${value}$`, "i");
			const gameSystem = gameSystems.find(system => regex.test(system.code));
			if (gameSystem) {
				return gameSystem;
			}
		}
	}
	return undefined;
}
