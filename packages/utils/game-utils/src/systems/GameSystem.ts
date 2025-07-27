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
	/** Generic d20 */
	D20 = 50,
	/** Dungeons and Dragons 5e */
	DnD5e = 55,
	/** Quest */
	Quest = 71,
	/** Vampire: The Masquerade 5e */
	VtM5e = 85
}

export type GameSystemCode = keyof typeof GameSystemType;

export type DiceSystemCode = GameSystemCode;

export type GameSystem = {
	/** Short code for the game system */
	code: GameSystemCode;
	/** Description of the game */
	description: string;
	/** Which dice system does the game use */
	dice: DiceSystemCode;
	/** Name of the game */
	name: string;
	/** Numeric enum value for the game system */
	type: GameSystemType;
	/** Default method of rolling critical dice for systems that have critical dice. */
	diceCritMethod?: "RollTwice" | "TimesTwo";
	/** Helper flag for E20 (Renegade Games Essence 20) games */
	isE20?: boolean;
	/** Helper flag for P20 (Paizo d20; PF2e/SF2e) games */
	isP20?: boolean;
};

/** Stores all the available Game Systems. */
const gameSystems: GameSystem[] = [
	{ code:"None",  dice:"None",  name:"None", description:"No Game System." },
	{ code:"CnC",   dice:"CnC",   name:"Coyote & Crow", description:"" },
	{ code:"DnD5e", dice:"DnD5e", name:"Dungeons & Dragons 5e", description:"", diceCritMethod:"TimesTwo" },
	{ code:"E20",   dice:"E20",   name:"Essence 20", description:"" },
	{ code:"PF1e",  dice:"PF1e",  name:"Pathfinder 1e", description:"" },
	{ code:"PF2e",  dice:"PF2e",  name:"Pathfinder 2e", description:"", diceCritMethod:"TimesTwo", isP20:true },
	{ code:"Quest", dice:"Quest", name:"Quest RPG", description:"" },
	{ code:"SF1e",  dice:"SF1e",  name:"Starfinder 1e", description:"", diceCritMethod:"RollTwice" },
	{ code:"SF2e",  dice:"SF2e",  name:"Starfinder 2e", description:"", diceCritMethod:"TimesTwo", isP20:true },
	{ code:"VtM5e", dice:"VtM5e", name:"Vampire: the Masquerade 5e", description:"" },
].map(system => ({ ...system, type:GameSystemType[system.code as keyof typeof GameSystemType] } as GameSystem));

/** Returns an array of the available Game Systems. */
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
			return gameSystems.find(system => regex.test(system.code));
		}
	}
	return undefined;
}

/*
https://www.promethiumbooks.com/system-reference-documents

sage! macro set name="pDice" dice="[1d20 + {0:1}d{d10:10} + {1:0}d{dMod:0} 1dmax({d10:10},{dMod:0})]"

[pdice]
[pdice 2]
[pdice d10=8]
[pdice 2 d10=8]
[pdice 1 1 dmod=4]
[pdice 2 2 dmod=12]
*/