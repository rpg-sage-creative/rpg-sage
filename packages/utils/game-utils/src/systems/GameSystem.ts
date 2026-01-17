import { DiceCriticalMethodType } from "../dice/types/DiceCriticalMethodType.js";

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

type GameSystemBase = {
	/** Short code for the game system */
	code: GameSystemCode;
	/** Description of the game */
	desc: string;
	/** Which dice system does the game use */
	dice: DiceSystemCode;
	/** Name of the game */
	name: string;
	/** Default method of rolling critical dice for systems that have critical dice. */
	diceCritMethod?: keyof typeof DiceCriticalMethodType;
	/** Helper flag for E20 (Renegade Games Essence 20) games */
	isE20?: boolean;
	/** Helper flag for P20 (Paizo d20; PF2e/SF2e) games */
	isP20?: boolean;
};

export type GameSystem = {
	/** Short code for the game system */
	code: GameSystemCode;
	codeLower: Lowercase<GameSystemCode>;
	/** Description of the game */
	desc: string;
	/** Which dice system does the game use */
	dice: DiceSystemCode;
	/** Name of the game */
	name: string;
	/** Numeric enum value for the game system */
	type: GameSystemType;
	/** Default method of rolling critical dice for systems that have critical dice. */
	diceCritMethodType?: DiceCriticalMethodType;
	/** Helper flag for E20 (Renegade Games Essence 20) games */
	isE20?: boolean;
	/** Helper flag for P20 (Paizo d20; PF2e/SF2e) games */
	isP20?: boolean;
};

/** Stores all the available Game Systems. */
const gameSystems: GameSystem[] = ((): GameSystemBase[] => {
	return [
		{ code:"None",  dice:"None",  name:"None",                       desc:"No Game System." },
		{ code:"CnC",   dice:"CnC",   name:"Coyote & Crow",              desc:"" },
		{ code:"DnD5e", dice:"DnD5e", name:"Dungeons & Dragons 5e",      desc:"", diceCritMethod:"TimesTwo" },
		{ code:"E20",   dice:"E20",   name:"Essence 20",                 desc:"", isE20:true },
		{ code:"PF1e",  dice:"D20",   name:"Pathfinder 1e",              desc:"" },
		{ code:"PF2e",  dice:"PF2e",  name:"Pathfinder 2e",              desc:"", isP20:true, diceCritMethod:"TimesTwo" },
		{ code:"Quest", dice:"Quest", name:"Quest RPG",                  desc:"" },
		{ code:"SF1e",  dice:"SF1e",  name:"Starfinder 1e",              desc:"", diceCritMethod:"RollTwice" },
		{ code:"SF2e",  dice:"PF2e",  name:"Starfinder 2e",              desc:"", isP20:true, diceCritMethod:"TimesTwo" },
		{ code:"VtM5e", dice:"VtM5e", name:"Vampire: the Masquerade 5e", desc:"" },
	];
})().map(gameSystem => (
	{
		...gameSystem,
		codeLower: gameSystem.code.toLowerCase(),
		type: GameSystemType[gameSystem.code],
		diceCritMethodType: DiceCriticalMethodType[gameSystem.diceCritMethod!]
	}
));

/** Returns an array of the available Game Systems. */
export function getGameSystems(): GameSystem[];
/** Returns an array of the available Game Systems filtered by the given codes. */
export function getGameSystems(...codes: GameSystemCode[]): (GameSystem & { code:GameSystemCode; })[];
export function getGameSystems(...codes: GameSystemCode[]): GameSystem[] {
	if (codes.length) {
		return gameSystems.filter(({code}) => codes.includes(code));
	}
	return gameSystems;
}

/** Returns a game system if found, undefined otherwise. */
export function parseGameSystem(value?: string | number | null): GameSystem | undefined {
	if (value) {
		if (typeof(value) === "number") {
			return gameSystems.find(system => system.type === value);
		}else {
			const lower = value.toLowerCase();
			return gameSystems.find(system => system.codeLower === lower);
		}
	}
	return undefined;
}

/** Reusable method for displaying the DiceCriticalMethodType used by a channel/game/server. */
export function getCriticalMethodText(gameSystemType?: GameSystemType, method?: DiceCriticalMethodType, inherited?: DiceCriticalMethodType): string {
	const gameSystem = parseGameSystem(gameSystemType);
	if (gameSystem?.diceCritMethodType) {
		if (method !== undefined) return DiceCriticalMethodType[method];
		if (inherited !== undefined) return `<i>inherited (${DiceCriticalMethodType[inherited]})</i>`;
		return `<i>unset (${DiceCriticalMethodType[gameSystem.diceCritMethodType]})</i>`;
	}
	const critSystems = gameSystems
		.filter(system => system.diceCritMethodType)
		.map(system => system.code)
		.join(", ");
	return `<i>only ${critSystems}</i>`;
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