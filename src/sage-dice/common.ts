import utils, { IdCore, TToken } from "../sage-utils";

//#region rpg.common.ts

export enum DiceSecretMethodType { Ignore = 0, Hide = 1, GameMasterChannel = 2, GameMasterDirect = 3 }

//#region GameType

export type TGameType = "NONE" | "PF" | "PF1" | "PF1E" | "PF2" | "PF2E" | "SF" | "SF1" | "SF1E" | "DND5E" | "5E";

export enum GameType {
	None = 0,
	/* Pathfinder 1e */
	PF1e = 11,
	/* Pathfinder 2e */
	PF2e = 12,
	/* Starfinder */
	SF1e = 21,
	/* Coyote & Crow */
	CnC = 31,
	/* Dungeons and Dragons 5e */
	DnD5e = 55,
	/* Quest */
	Quest = 71
}

const GameTypeMap = {
	"NONE":GameType.None,
	"5E":GameType.DnD5e, "DND5E":GameType.DnD5e,
	"PF":GameType.PF1e, "PF1":GameType.PF1e, "PF1E":GameType.PF1e,
	"PF2":GameType.PF2e, "PF2E":GameType.PF2e,
	"SF":GameType.SF1e, "SF1":GameType.SF1e, "SF1E":GameType.SF1e,
	"QUEST":GameType.Quest,
	"CNC":GameType.CnC
};

export function parseGameType(gameType: string, defaultGameType?: GameType): GameType | undefined {
	return GameTypeMap[<TGameType>String(gameType).toUpperCase()] ?? defaultGameType;
}

//#endregion

//#region DiceOutputType

export type TDiceOutputType = keyof typeof DiceOutputType;

export enum DiceOutputType { XXS = -3, XS = -2, S = -1, M = 0, L = 1, XL = 2, XXL = 3 }

export function parseDiceOutputType(outputType: string, defaultOutputType?: DiceOutputType): DiceOutputType | undefined {
	return DiceOutputType[<TDiceOutputType>String(outputType).toUpperCase()] ?? defaultOutputType;
}

//#endregion

//#region CritMethodType

export enum CritMethodType { Unknown = 0, TimesTwo = 1, RollTwice = 2, AddMax = 3 }

type TTypedMap<T> = { [key: string]: T; };

const CritMethodTypeMap: TTypedMap<TTypedMap<CritMethodType>> = {
	"PF2E":{ "TIMESTWO":CritMethodType.TimesTwo, "ROLLTWICE":CritMethodType.RollTwice, "ADDMAX":CritMethodType.AddMax }
};

export function parseCritMethodType(gameType: GameType | undefined, critMethod: string, defaultCritMethod?: CritMethodType): CritMethodType | undefined {
	const map = CritMethodTypeMap[String(GameType[gameType!]).toUpperCase()];
	if (map) {
		return map[String(critMethod).toUpperCase()] ?? defaultCritMethod;
	}
	return defaultCritMethod;
}

export function getCritMethodRegex(gameType: GameType | undefined): RegExp | null {
	if (gameType === GameType.PF2e) {
		return /^(timestwo|rolltwice|addmax)?/i;
	}
	return null;
}

//#endregion

//#endregion

//#region rpg.dice.common.ts

//#region CONST

export const UNICODE_LEFT_ARROW = "\u27f5";

export const SECRET_REGEX = /secret/i;

//#endregion

//#region DiceString

/** This strips a trailing colon (,) or semicolon (;) */
export function cleanDescription(description?: string): string {
	const replaced = (description ?? "").replace(/[;,]\s*$/, "");
	return utils.StringUtils.cleanWhitespace(replaced);
}

export function filterExists<T>(value: T): boolean {
	return utils.ArrayUtils.Filters.exists(value) && <unknown>value !== "";
}

//#endregion

//#region rollDice, sum, toMod

export function rollDice(count: number, sides: number): number[] {
	const rolls: number[] = [];
	for (let i = count; i--;) {
		rolls.push(utils.RandomUtils.random(sides));
	}
	return rolls;
}

export function sum(values: number[]): number {
	return values.reduce((total, value) => total + value, 0);
}

export function sumDropKeep(values: number[], dropKeep?: TDropKeepData): number {
	if (!dropKeep) {
		return sum(values);
	}
	const sorted = values.slice().sort(utils.ArrayUtils.Sort.sortAscending);
	switch (dropKeep.type) {
		case DropKeepType.DropHighest:
			return sum(sorted.slice(0, -dropKeep.value));
		case DropKeepType.DropLowest:
			return sum(sorted.slice(dropKeep.value));
		case DropKeepType.KeepHighest:
			return sum(sorted.slice(-dropKeep.value));
		case DropKeepType.KeepLowest:
			return sum(sorted.slice(0, dropKeep.value));
		default:
			console.warn(`Invalid dropKeep.type = ${dropKeep.type} (${DropKeepType[dropKeep.type]})`);
			return sum(values);
	}
}

type THasSignAndTotal = { sign?:TSign; total:number; };
export function sumDicePartRolls(dicePartRolls: THasSignAndTotal[]): number {
	return dicePartRolls.reduce((value, dicePartRoll) => {
		if (dicePartRoll.sign === "-") {
			return value + dicePartRoll.total;
		} else if (dicePartRoll.sign === "*") {
			return value * dicePartRoll.total;
		} else if (dicePartRoll.sign === "/") {
			return value / dicePartRoll.total;
		} else {
			return value + dicePartRoll.total;
		}
	}, 0);
}

export function toMod(mod: number, spaced = false): string {
	return `${mod < 0 ? "-" : "+"}${spaced ? " " : ""}${Math.abs(mod)}`;
}

//#endregion

//#region DropKeep
export enum DropKeepType { None = 0, DropLowest = 1, DropHighest = 2, KeepLowest = 3, KeepHighest = 4 }
export function parseDropKeepType(dropKeepType: string): DropKeepType {
	const cleanedDropKeepTypeString = dropKeepType.toLowerCase().slice(0, 2);
	switch(cleanedDropKeepTypeString) {
		case "dl": return DropKeepType.DropLowest;
		case "dh": return DropKeepType.DropHighest;
		case "kl": return DropKeepType.KeepLowest;
		case "kh": return DropKeepType.KeepHighest;
		default: return DropKeepType.None;
	}
}

const DropKeepTypeAliases = [undefined, "dl", "dh", "kl", "kh" ];
export type TDropKeepData = { type:DropKeepType; value:number; alias?:string; };
export function createValueDropKeepData(type: DropKeepType, value: number, alias = DropKeepTypeAliases[type]): TDropKeepData {
	return { type:type, value:value, alias:alias };
}
export function parseValueDropKeepData(token: TToken): TDropKeepData | undefined {
	if (token.matches) {
		const type = parseDropKeepType(token.matches[0]);
		const value = +token.matches[1] || 1;
		return createValueDropKeepData(type, value);
	}
	return undefined;
}
export function dropKeepToString(dropKeep: TDropKeepData): string {
	if (dropKeep) {
		if (DropKeepTypeAliases.includes(dropKeep.alias)) {
			return `${dropKeep.alias} ${dropKeep.value}`;
		}
		return `(${dropKeep.alias})`;
	}
	return ``;
}
//#endregion

//#region Tests

export enum TestType { None = 0, Equal = 1, GreaterThan = 2, GreaterThanOrEqual = 3, LessThan = 4, LessThanOrEqual = 5 }

export function parseTestType(testType: string): TestType {
	const cleanedTestTypeString = testType.replace(/=+/g, "=").toLowerCase();
	if (["eq", "="].includes(cleanedTestTypeString)) {
		return TestType.Equal;
	}
	if (["gt", ">"].includes(cleanedTestTypeString)) {
		return TestType.GreaterThan;
	}
	if (["lt", "<"].includes(cleanedTestTypeString)) {
		return TestType.LessThan;
	}
	if (["gteq", "gte", ">="].includes(cleanedTestTypeString)) {
		return TestType.GreaterThanOrEqual;
	}
	if (["lteq", "lte", "<="].includes(cleanedTestTypeString)) {
		return TestType.LessThanOrEqual;
	}
	return TestType.None;
}

const TestTypeAliases = [undefined, "=", ">", ">=", "<", "<=" ];
export type TTestData = { type:TestType; value:number; alias?:string; };
export function createValueTestData(type: TestType, value: number, alias = TestTypeAliases[type]): TTestData {
	return { type:type, value:value, alias:alias };
}
export function parseValueTestData(token: TToken): TTestData | undefined {
	if (token.matches) {
		const type = parseTestType(token.matches[0]);
		const value = +token.matches[1] || 0;
		return createValueTestData(type, value);
	}
	return undefined;
}
//#endregion

//#region Grades

export enum DieRollGrade { Unknown = 0, CriticalFailure = 1, Failure = 2, Success = 3, CriticalSuccess = 4 }

type TDieRollGradeEmoji = undefined | "[critical-success]" | "[success]" | "[failure]" | "[critical-failure]";

const DieRollGradeEmojis: TDieRollGradeEmoji[] = [undefined, "[critical-failure]", "[failure]", "[success]", "[critical-success]"];

export function isGradeSuccess(grade: DieRollGrade): boolean {
	return grade === DieRollGrade.Success || grade === DieRollGrade.CriticalSuccess;
}

export function isGradeFailure(grade: DieRollGrade): boolean {
	return grade === DieRollGrade.Failure || grade === DieRollGrade.CriticalFailure;
}

export function increaseGrade(grade: DieRollGrade): DieRollGrade {
	return ensureGrade(grade + 1, grade);
}

export function decreaseGrade(grade: DieRollGrade): DieRollGrade {
	return ensureGrade(grade - 1, grade);
}

function ensureGrade(grade: DieRollGrade, defaultGrade: DieRollGrade): DieRollGrade {
	return grade && DieRollGrade[grade] ? grade : defaultGrade;
}

export function gradeToEmoji(grade: DieRollGrade): TDieRollGradeEmoji {
	return grade ? DieRollGradeEmojis[grade] : undefined;
}

//#endregion

//#region Interfaces/Types

export type TDiceLiteral = `${number}d${number}` | `${number}d${number}+${number}` | `${number}d${number}-${number}`;

export type TDiceOutput = {
	hasSecret: boolean;
	inlineOutput: string;
	input: string,
	output: string;
};

export type TSign = "+" | "-" | "*" | "/";

export interface DieCore<T extends string = string> extends IdCore<T> {
	gameType: GameType;
}
export abstract class HasDieCore<T extends DieCore<U>, U extends string = string> extends utils.ClassUtils.HasIdCore<T, U> {
	public get gameType(): GameType { return this.core.gameType; }
}

export interface IDiceBase<T extends IRollBase = IRollBase<any>> extends HasDieCore<DieCore> {
	hasSecret: boolean;
	roll(): T;
}

export interface IRollBase<T extends IDiceBase = IDiceBase<any>, U = any> extends HasDieCore<DieCore> {
	hasSecret: boolean;
	dice: T;
	rolls: U[];
	toString(outputType?: DiceOutputType): string;
}

export function mapRollToJson<T extends IDiceBase, U extends DieCore>(die: T): U {
	return die.roll().toJSON() as U;
}

//#endregion

//#endregion
