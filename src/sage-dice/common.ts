import { HasIdCore, sortPrimitive, sum, warn, type IdCore, type TokenData } from "@rsc-utils/core-utils";
import { DiceOutputType, GameSystemType } from "@rsc-utils/game-utils";
import type { TDiceRoll } from "./dice/base/types.js";

//#region rollDice, sum, toMod

export function sumDropKeep(values: number[], dropKeep?: TDropKeepData): number {
	if (!dropKeep) {
		return sum(values);
	}
	const sorted = values.slice().sort(sortPrimitive);
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
			warn(`Invalid dropKeep.type = ${dropKeep.type} (${DropKeepType[dropKeep.type]})`);
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
export function parseValueDropKeepData(token: TokenData): TDropKeepData | undefined {
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
	gameType: GameSystemType;
}
export abstract class HasDieCore<T extends DieCore<U>, U extends string = string> extends HasIdCore<T, U> {
	public get gameType(): GameSystemType { return this.core.gameType; }
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
