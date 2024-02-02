import { HasIdCore, type IdCore } from "@rsc-utils/class-utils";
import { cleanWhitespace } from "@rsc-utils/string-utils";
import { GameType } from "../sage-common";

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
