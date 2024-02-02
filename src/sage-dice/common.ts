import { HasIdCore, type IdCore } from "@rsc-utils/class-utils";
import { warn } from "@rsc-utils/console-utils";
import { cleanWhitespace, type TokenData } from "@rsc-utils/string-utils";
import { GameType } from "../sage-common";
import type { TDiceRoll } from "./dice/base/types";

//#region rpg.common.ts

export enum DiceSecretMethodType { Ignore = 0, Hide = 1, GameMasterChannel = 2, GameMasterDirect = 3 }

//#region DiceOutputType

export type TDiceOutputType = keyof typeof DiceOutputType;

export enum DiceOutputType { XXS = -3, XS = -2, S = -1, M = 0, L = 1, XL = 2, XXL = 3, ROLLEM = 5 }

export function parseDiceOutputType(outputType: string, defaultOutputType?: DiceOutputType): DiceOutputType | undefined {
	return DiceOutputType[<TDiceOutputType>String(outputType).toUpperCase()] ?? defaultOutputType;
}

//#endregion

//#region CritMethodType

export enum CritMethodType { Unknown = 0, TimesTwo = 1, RollTwice = 2, AddMax = 3 }

type TTypedMap<T> = { [key: string]: T; };

const CritMethodTypeMap: TTypedMap<TTypedMap<CritMethodType>> = {
	"DND5E":{ "TIMESTWO":CritMethodType.TimesTwo, "ROLLTWICE":CritMethodType.RollTwice, "ADDMAX":CritMethodType.AddMax },
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
	if ([GameType.DnD5e, GameType.PF2e].includes(gameType!)) {
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
	return cleanWhitespace(replaced);
}

//#endregion

//#region rollDice, sum, toMod

export function sum(values: number[]): number {
	return values.reduce((total, value) => total + value, 0);
}

// export function sumDropKeep(values: number[], dropKeep?: TDropKeepData): number {
// 	if (!dropKeep) {
// 		return sum(values);
// 	}
// 	const sorted = values.slice().sort(sortPrimitive);
// 	switch (dropKeep.type) {
// 		case DropKeepType.DropHighest:
// 			return sum(sorted.slice(0, -dropKeep.value));
// 		case DropKeepType.DropLowest:
// 			return sum(sorted.slice(dropKeep.value));
// 		case DropKeepType.KeepHighest:
// 			return sum(sorted.slice(-dropKeep.value));
// 		case DropKeepType.KeepLowest:
// 			return sum(sorted.slice(0, dropKeep.value));
// 		default:
// 			warn(`Invalid dropKeep.type = ${dropKeep.type} (${DropKeepType[dropKeep.type]})`);
// 			return sum(values);
// 	}
// }

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

export type TTestData = { type:TestType; value:number; hidden:boolean; alias?:string; };

export function createValueTestData(type: TestType, value: number, hidden: boolean, alias = TestTypeAliases[type]): TTestData {
	return { type, value, hidden, alias };
}

export function parseTestTargetValue(rawValue: string): { value:number; hidden:boolean; } {
	const hidden = rawValue.length > 4 && rawValue.startsWith("||") && rawValue.endsWith("||");
	const value = +(hidden ? rawValue.slice(2, -2) : rawValue) || 0;
	return { value, hidden };
}
export function parseValueTestData(token: TokenData): TTestData | undefined {
	if (token.matches) {
		const type = parseTestType(token.matches[0]);
		const { value, hidden } = parseTestTargetValue(token.matches[1]);
		return createValueTestData(type, value, hidden);
	}
	return undefined;
}

export function testRoll(roll: TDiceRoll): boolean | undefined {
	const test = roll.dice.test;
	if (test) {
		switch (test.type) {
			case TestType.Equal:
				return roll.total === test.value;
			case TestType.GreaterThan:
				return roll.total > test.value;
			case TestType.GreaterThanOrEqual:
				return roll.total >= test.value;
			case TestType.LessThan:
				return roll.total < test.value;
			case TestType.LessThanOrEqual:
				return roll.total <= test.value;
			default:
				warn(`testRoll(): invalid roll.dice.test.type = ${test.type} (${test.alias})`);
		}
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

function booleanToGrade(value: boolean | undefined): DieRollGrade {
	switch(value) {
		case true: return DieRollGrade.Success;
		case false: return DieRollGrade.Failure;
		default: return DieRollGrade.Unknown;
	}
}

export function gradeRoll(roll: TDiceRoll): DieRollGrade {
	return booleanToGrade(testRoll(roll));
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
export abstract class HasDieCore<T extends DieCore<U>, U extends string = string> extends HasIdCore<T, U> {
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
