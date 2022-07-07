//#region imports

import type { Optional, OrNull, OrUndefined, TParsers, TSortResult, TToken } from "../../../sage-utils";
import { sortAscending } from "../../../sage-utils/utils/ArrayUtils/Sort";
import { toJSON } from "../../../sage-utils/utils/ClassUtils";
import { cleanWhitespace, Tokenizer } from "../../../sage-utils/utils/StringUtils";
import { generate } from "../../../sage-utils/utils/UuidUtils";
import type {
	IDiceBase,
	IRollBase,
	TDiceLiteral,
	TDropKeepData,
	TSign,
	TTestData
} from "../../common";
import {
	cleanDescription, CritMethodType,
	DiceOutputType,
	DiceSecretMethodType,
	DieRollGrade, dropKeepToString, DropKeepType,
	GameType, gradeToEmoji, HasDieCore, mapRollToJson,
	parseValueDropKeepData,
	parseValueTestData,
	rollDice, SECRET_REGEX, sum,
	sumDicePartRolls,
	sumDropKeep, TestType, UNICODE_LEFT_ARROW
} from "../../common";
import type {
	DiceCore, DiceGroupCore, DiceGroupRollCore,
	DicePartCore, DicePartRollCore, DiceRollCore, TDice, TDiceGroup, TDiceGroupRoll, TDicePart, TDicePartCoreArgs, TDicePartRoll, TDiceRoll
} from "./types";

//#endregion

//#region html formatting

function bold(value: string): string {
	return `<b>${value}</b>`;
}
function italics(value: string): string {
	return `<i>${value}</i>`;
}
function strike(value: string): string {
	return `<s>${value}</s>`;
}

//#endregion

//#region Tokenizer

/** Returns a new object with the default dice parsers for use with Tokenizer */
export function getParsers(): TParsers {
	return {
		dice: /([\-\+\*\/])?(?:\s*(\d+)\s*|\b)d\s*(\d+)/i,
		dropKeep: /(dl|dh|kl|kh)\s*(\d+)?/i,
		noSort: /(ns)/i,
		mod: /([\-\+\*\/])\s*(\d+)(?!d\d)/i,
		quotes: /`[^`]+`|"[^"]+"/,
		test: /(gteq|gte|gt|lteq|lte|lt|eq|=+|>=|>|<=|<)\s*(\d+)/i
	};
}

//#region Token Reduce Helpers

/** Appends the token's value to the core's description */
function reduceDescriptionToken<T extends DicePartCore>(core: T, token: TToken): T {
	core.description = (core.description ?? "") + token.token;
	return core;
}

export type TReduceSignToDropKeep = {
	sign: TSign;
	type: DropKeepType;
	value: number;
	alias: string;
	test: (core: DicePartCore, token: TToken) => boolean;
};
/**
 * Sets the core's .sign, .count, and .sides values from the tokens .matches
 * If reducePlusMinusToDropKeepData provided, a +2d20/-2d20 roll will be converted to 2d20kh1/2d20kl1 (Fortune/Misfortune; Advantage/Disadvantage)
 * */
function reduceDiceToken<T extends DicePartCore>(core: T, token: TToken, reduceSignToDropKeepData?: TReduceSignToDropKeep[]): T {
	if (token.matches) {
		core.sign = <TSign>token.matches[0];
		core.count = +token.matches[1] || 0;
		core.sides = +token.matches[2] || 0;
		if (!core.count && core.sides) {
			core.count = 1;
		}
	}
	const dropKeep = reduceSignToDropKeepData?.find(dropKeepData => dropKeepData.test(core, token));
	if (dropKeep) {
		core.dropKeep = dropKeep;
		delete core.sign;
	}
	return core;
}

function reduceDropKeepToken<T extends DicePartCore>(core: T, token: TToken, lastToken: TToken): T {
	if (["dice", "noSort"].includes(lastToken?.type)) {
		core.dropKeep = parseValueDropKeepData(token);
		return core;
	}
	return reduceDescriptionToken(core, token);
}

function reduceNoSortToken<T extends DicePartCore>(core: T, token: TToken, lastToken: TToken): T {
	if (["dice", "dropKeep"].includes(lastToken?.type)) {
		core.noSort = true;
		return core;
	}
	return reduceDescriptionToken(core, token);
}

function reduceModToken<T extends DicePartCore>(core: T, token: TToken): T {
	if (token.matches) {
		core.sign = <TSign>token.matches[0];
		core.modifier = +token.matches[1] || 0;
	}
	return core;
}

function reduceTestToken<T extends DicePartCore>(core: T, token: TToken): T {
	core.test = parseValueTestData(token);
	return core;
}

//#endregion

export function reduceTokenToDicePartCore<T extends DicePartCore>(core: T, token: TToken, index: number, tokens: TToken[], reduceSignToDropKeepData?: TReduceSignToDropKeep[]): T {
	switch (token.type) {
		case "dice": return reduceDiceToken(core, token, reduceSignToDropKeepData);
		case "dropKeep": return reduceDropKeepToken(core, token, tokens[index - 1]);
		case "noSort": return reduceNoSortToken(core, token, tokens[index - 1]);
		case "mod": return reduceModToken(core, token);
		case "test": return reduceTestToken(core, token);

		//TODO: after doing a test, this needs to become another dicepart
		default: return reduceDescriptionToken(core, token);
	}
}

//#endregion

//#region Grades

function booleanToGrade(value: boolean): DieRollGrade {
	return value ? DieRollGrade.Success : DieRollGrade.Failure;
}

function gradeResults(roll: TDiceRoll): DieRollGrade {
	if (!roll.dice.hasTest) {
		return DieRollGrade.Unknown;
	}
	const test = roll.dice.test!;
	switch (test.type) {
		case TestType.Equal:
			return booleanToGrade(roll.total === test.value);
		case TestType.GreaterThan:
			return booleanToGrade(roll.total > test.value);
		case TestType.GreaterThanOrEqual:
			return booleanToGrade(roll.total >= test.value);
		case TestType.LessThan:
			return booleanToGrade(roll.total < test.value);
		case TestType.LessThanOrEqual:
			return booleanToGrade(roll.total <= test.value);
		default:
			console.warn(`dice.gradeResults(): invalid dice.test.type = ${test.type} (${test.alias})`);
			return DieRollGrade.Unknown;
	}
}

//#endregion

//#region dicePartRollToString

type TRollAndIndex = {
	/** The roll value */
	roll: number;
	/** The original index of the roll (order it was rolled in) */
	index: number;
	/** String output to be bolded, italicized, or striked */
	output: string;
};

function mapRollAndIndex(sides: number, roll: number, index: number): TRollAndIndex {
	let output = String(roll);
	if (roll === sides) {
		output = bold(output);
	}
	if (roll === 1) {
		output = italics(output);
	}
	return { roll:roll, index:index, output:output };
}

type TMappedAndSortedRolls = { byIndex:TRollAndIndex[]; byRoll:TRollAndIndex[]; length:number };

function sortRollAndIndex(a: TRollAndIndex, b: TRollAndIndex): TSortResult {
	const byRoll = sortAscending(a.roll, b.roll);
	if (byRoll !== 0) {
		return byRoll;
	}
	// The second sort of .index ensures that the first of two equal rolls is on the left so that we properly strike them in order.
	return sortAscending(a.index, b.index);
}

function mapAndSortRolls(sides: number, rolls: number[]): TMappedAndSortedRolls {
	const byIndex = rolls.map((roll, index) => mapRollAndIndex(sides, roll, index));
	const byRoll = byIndex.slice().sort(sortRollAndIndex);
	return { byIndex:byIndex, byRoll:byRoll, length:rolls.length };
}

function shouldStrikeRoll(dropKeep: TDropKeepData, rollCount: number, sortedIndex: number): boolean {
	return dropKeep.type === DropKeepType.DropHighest && sortedIndex >= (rollCount - dropKeep.value)
		|| dropKeep.type === DropKeepType.DropLowest && sortedIndex < dropKeep.value
		|| dropKeep.type === DropKeepType.KeepHighest && sortedIndex < (rollCount - dropKeep.value)
		|| dropKeep.type === DropKeepType.KeepLowest && sortedIndex >= dropKeep.value;
}

function strikeDroppedRolls(dropKeep: Optional<TDropKeepData>, sortedRolls: TRollAndIndex[]): void {
	if (dropKeep) {
		const rollCount = sortedRolls.length;
		sortedRolls.forEach((rollAndIndex, sortedIndex) => {
			if (shouldStrikeRoll(dropKeep, rollCount, sortedIndex)) {
				rollAndIndex.output = strike(rollAndIndex.output);
			}
		});
	}
}

function diceTotalToString(value: number): string {
	return italics(bold(String(value)));
}

function dicePartRollToString(dicePartRoll: TDicePartRoll): string {
	const sides = dicePartRoll.dice.sides,
		rollsAndIndexes = mapAndSortRolls(sides, dicePartRoll.rolls);
	strikeDroppedRolls(dicePartRoll.dice.dropKeep, rollsAndIndexes.byRoll);
	const outputRollsAndIndexes = dicePartRoll.dice.noSort ? rollsAndIndexes.byIndex : rollsAndIndexes.byRoll;
	const mappedOutuputRolls = outputRollsAndIndexes.map(rollAndIndex => rollAndIndex.output);
	return `[${mappedOutuputRolls.join(", ")}]`;
}

type TDicePartToString = (dicePartRoll: TDicePartRoll) => string;

function mapDicePartRollToString(dicePartRoll: TDicePartRoll, includeSign: boolean, includeModifier: boolean, includeDescription: boolean, dieModToString: TDicePartToString): string {
	let dicePartRollOutput = "";
	if (includeSign && (dicePartRoll.dice.hasDie || dicePartRoll.dice.modifier)) {
		dicePartRollOutput += ` ${dicePartRoll.sign || "+"}`;
	}
	dicePartRollOutput += ` ${dieModToString(dicePartRoll)}`;
	if (includeModifier && dicePartRoll.dice.modifier) {
		dicePartRollOutput += ` ${Math.abs(dicePartRoll.dice.modifier)}`;
	}
	if (includeDescription) {
		dicePartRollOutput += ` ${dicePartRoll.dice.description}`;
	}
	if (dicePartRoll.dice.hasTest) {
		dicePartRollOutput += ` ${dicePartRoll.dice.test!.alias} ${dicePartRoll.dice.test!.value}`;
	}
	return dicePartRollOutput.replace(/ +/g, " ").trim();
}

type TDicePartRollToString = (dicePartRoll: TDicePartRoll, index: number, hideRolls: boolean, rollem: boolean) => string;

function mapDicePartRollToStringWithDice(dicePartRoll: TDicePartRoll, index: number, hideRolls: boolean, rollem: boolean): string {
	return mapDicePartRollToString(dicePartRoll, index > 0 || (dicePartRoll.sign !== undefined && dicePartRoll.sign !== "+"), !rollem, true, dpr => {
		if (hideRolls && dpr.dice.hasDie) {
			return ` ||${dicePartRollToString(dpr)}||${dpr.dice.count}d${dpr.dice.sides} `;
		}
		return dpr.dice.hasDie ? ` ${dicePartRollToString(dpr)}${dpr.dice.count}d${dpr.dice.sides} ` : ``;
	});
}

function mapDicePartRollToStringWithoutDice(dicePartRoll: TDicePartRoll, index: number, hideRolls: boolean): string {
	return mapDicePartRollToString(dicePartRoll, index > 0 || dicePartRoll.sign !== undefined && dicePartRoll.sign !== "+", true, true, dpr => {
		if (hideRolls && dpr.dice.hasDie) {
			return ` ||${dicePartRollToString(dpr)}|| `;
		}
		return dpr.dice.hasDie ? ` ${dicePartRollToString(dpr)} ` : ``;
	});
}

//#endregion

//#region DicePart

export class DicePart<T extends DicePartCore, U extends TDicePartRoll> extends HasDieCore<T> implements IDiceBase<U> {
	//#region from this.core
	public get count(): number { return this.core.count; }
	public get description(): string { return this.core.description; }
	public get dropKeep(): OrUndefined<TDropKeepData> { return this.core.dropKeep; }
	public get modifier(): number { return this.core.modifier; }
	public get noSort(): boolean { return this.core.noSort; }
	public get sides(): number { return this.core.sides; }
	public get sign(): OrUndefined<TSign> { return this.core.sign; }
	public get test(): OrUndefined<TTestData> { return this.core.test; }
	//#endregion

	//#region calculated
	public get adjustedCount(): number {
		const dropKeep = this.dropKeep;
		if (dropKeep) {
			switch(dropKeep.type) {
				case DropKeepType.DropHighest:
				case DropKeepType.DropLowest:
					return this.count - dropKeep.value;
				case DropKeepType.KeepHighest:
				case DropKeepType.KeepLowest:
					return dropKeep.value;
			}
		}
		return this.count;
	}
	private get biggest(): number { return this.adjustedCount * this.sides + this.modifier; }
	private get smallest(): number { return this.adjustedCount + this.modifier; }
	public get max(): number { return this.sign === "-" ? -1 * this.smallest : this.biggest; }
	public get min(): number { return this.sign === "-" ? -1 * this.biggest : this.smallest; }
	//#endregion

	//#region flags
	public get hasDescription(): boolean { return this.core.description.length > 0; }
	public get hasDie(): boolean { return this.count > 0 && this.sides > 0; }
	public get hasDropKeep(): boolean { return this.dropKeep !== null && this.dropKeep !== undefined; }
	public get hasTest(): boolean { return this.test !== null && this.test !== undefined; }
	public get isEmpty(): boolean { return this.count === 0 && this.sides === 0 && this.modifier === 0; }
	//#endregion

	//#region methods

	/** Returns null if this.isEmpty is true, otherwise it returns the results */
	public quickRoll(): OrNull<number> {
		if (this.isEmpty) {
			return null;
		}
		const _constructor = <typeof DicePart>this.constructor;
		const roll = <U>_constructor.Roll.create(this);
		return roll.total;
	}

	//#endregion

	//#region DiceBase
	public get hasSecret(): boolean {
		return this.description.match(SECRET_REGEX) !== null;
	}
	public roll(): U {
		const _constructor = <typeof DicePart>this.constructor;
		return <U>_constructor.Roll.create(this);
	}
	public toString(index?: number, outputType?: DiceOutputType): string {
		const die = this.count && this.sides ? `${this.count}d${this.sides}` : ``,
			dropKeep = this.dropKeep ? ` ${dropKeepToString(this.dropKeep)}` : ``,
			mod = this.modifier ? ` ${this.modifier}` : ``,
			valueTest = this.hasTest ? ` ${this.test!.alias} ${this.test!.value}` : ``,
			withoutDescription = die + dropKeep + mod + valueTest;
		if (outputType === DiceOutputType.S) {
			return withoutDescription;
		}
		const sign = index && !this.isEmpty ? `${this.sign || "+"}` : ``;
		return `${sign} ${withoutDescription} ${this.description}`.trim();
	}
	//#endregion

	//#region static
	public static create({ count, sides, dropKeep, noSort, modifier, sign, description, test }: TDicePartCoreArgs = {}): TDicePart {
		return new DicePart({
			objectType: "DicePart",
			gameType: GameType.None,
			id: generate(),

			count: count ?? 0,
			description: cleanDescription(description),
			dropKeep: dropKeep ?? undefined,
			modifier: modifier ?? 0,
			noSort: noSort === true,
			sides: sides ?? 0,
			sign: sign ?? undefined,
			test: test ?? undefined
		});
	}
	public static fromCore(core: DicePartCore): TDicePart {
		return new DicePart(core);
	}
	public static fromTokens(tokens: TToken[]): TDicePart {
		const core = tokens.reduce(reduceTokenToDicePartCore, <DicePartCore>{ description:"" });
		return DicePart.create(core);
	}
	public static toCore(dicePartOrCore: TDicePart | DicePartCore): DicePartCore {
		return "toJSON" in dicePartOrCore ? dicePartOrCore.toJSON() : dicePartOrCore;
	}
	public static Roll: typeof DicePartRoll;
	//#endregion
}

//#endregion

//#region DicePartRoll

export class DicePartRoll<T extends DicePartRollCore, U extends TDicePart> extends HasDieCore<T> implements IRollBase<U, number> {
	//#region from this.dice
	public get sign(): OrUndefined<TSign> {
		return this.dice.sign;
	}
	//#endregion

	//#region calculated
	public get total(): number {
		const mult = this.sign === "-" ? -1 : 1;
		return mult * (this.dice.modifier + sumDropKeep(this.rolls, this.dice.dropKeep));
	}
	//#endregion

	//#region flags
	public get isMax(): boolean { return this.total === this.dice.max; }
	public get isMin(): boolean { return this.total === this.dice.min; }
	//#endregion

	//#region RollBase
	private _dice?: U;
	public get dice(): U {
		if (!this._dice) {
			const fromCore = (<typeof DicePartRoll>this.constructor).Dice.fromCore;
			this._dice = <U>fromCore(this.core.dice);
		}
		return this._dice;
	}
	public get hasSecret(): boolean {
		return this.dice.hasSecret;
	}
	/** The raw rolls. */
	public get rolls(): number[] {
		return this.core.rolls.slice();
	}
	/** How many dice rolled 1. */
	public get minCount(): number {
		return this.core.rolls.filter(roll => roll === 1).length;
	}
	/** How many dice rolled max (value equal to .dice.sides). */
	public get maxCount(): number {
		return this.core.rolls.filter(roll => roll === this.dice.sides).length;
	}
	//#endregion

	//#region static
	public static create(dicePart: TDicePart): TDicePartRoll {
		return new DicePartRoll({
			objectType: "DicePartRoll",
			gameType: GameType.None,
			id: generate(),
			dice: dicePart.toJSON(),
			rolls: rollDice(dicePart.count, dicePart.sides)
		});
	}
	public static fromCore(core: DicePartRollCore): TDicePartRoll {
		return new DicePartRoll(core);
	}
	public static Dice = DicePart;
	//#endregion
}

DicePart.Roll = DicePartRoll;

//#endregion

//#region Dice

export class Dice<T extends DiceCore, U extends TDicePart, V extends TDiceRoll> extends HasDieCore<T> implements IDiceBase<V> {
	//#region from this.core
	private _diceParts?: U[];
	public get diceParts(): U[] {
		if (!this._diceParts) {
			const fromCore = (<typeof Dice>this.constructor).Part.fromCore;
			this._diceParts = <U[]>this.core.diceParts.map(fromCore);
		}
		return this._diceParts;
	}
	//#endregion

	//#region calculated
	public get baseDicePart(): OrUndefined<U> { return this.diceParts.find(dicePart => dicePart.hasDie); }
	public get max(): number { return sum(this.diceParts.map(dicePart => dicePart.max)); }
	public get min(): number { return sum(this.diceParts.map(dicePart => dicePart.min)); }
	public get test(): OrUndefined<TTestData> { return this.diceParts.find(dicePart => dicePart.hasTest)?.test; }
	//#endregion

	//#region flags
	public get hasTest(): boolean { return  this.test !== undefined; }
	public get isD20(): boolean { return this.baseDicePart?.sides === 20; }
	public get isEmpty(): boolean { return this.diceParts.length === 0 || this.diceParts.filter(dicePart => !dicePart.isEmpty).length === 0; }
	//#endregion

	//#region methods
	public includes(dicePartOrCore: TDicePart | DicePartCore): boolean {
		const dicePartCore = DicePart.toJSON<DicePartCore>(dicePartOrCore);
		return this.diceParts.find(_dicePart => _dicePart.toJSON() === dicePartCore) !== undefined;
	}

	/** Returns null if this.isEmpty is true, otherwise it returns the results */
	public quickRoll(): OrNull<number> {
		if (this.isEmpty) {
			return null;
		}
		const _constructor = <typeof Dice>this.constructor;
		const roll = <V>_constructor.Roll.create(this, false);
		return roll.total;
	}
	//#endregion

	//#region IHasDieCore
	public get hasSecret(): boolean { return this.diceParts.find(dicePart => dicePart.hasSecret) !== undefined; }
	//#endregion

	//#region DiceBase
	public roll(): V {
		const _constructor = <typeof Dice>this.constructor;
		return <V>_constructor.Roll.create(this, true);
	}
	public toString(outputType?: DiceOutputType): string {
		const _outputType = outputType === DiceOutputType.S ? DiceOutputType.S : DiceOutputType.M;
		const output = this.diceParts.map((dicePart, index) => dicePart.toString(index, _outputType)).join(" ");
		return cleanWhitespace(output);
	}
	//#endregion

	//#region static
	public static create(diceParts: TDicePart[]): TDice {
		return new Dice({
			objectType: "Dice",
			gameType: GameType.None,
			id: generate(),
			diceParts: diceParts.map<DicePartCore>(toJSON)
		});
	}
	public static fromCore(core: DiceCore): TDice {
		return new Dice(core);
	}
	public static fromDicePartCores(dicePartCores: DicePartCore[]): TDice {
		return Dice.create(dicePartCores.map(DicePart.fromCore));
	}
	public static parse(diceString: string): TDice {
		const diceGroup = DiceGroup.parse(diceString);
		return diceGroup && diceGroup.dice[0] || null;
	}
	/** Returns null if diceString can't be parsed, otherwise it returns the results */
	public static roll(diceString: TDiceLiteral): number;
	public static roll(diceString: string): OrNull<number>;
	public static roll(diceString: string): OrNull<number> {
		const _dice = Dice.parse(diceString);
		return _dice?.quickRoll() ?? null;
	}

	public static Part = DicePart;
	public static Roll: typeof DiceRoll;
	//#endregion
}

//#endregion

//#region DiceRoll

export class DiceRoll<T extends DiceRollCore, U extends TDice, V extends TDicePartRoll> extends HasDieCore<T> implements IRollBase<U, V> {
	//#region calculated
	public get grade(): DieRollGrade { return gradeResults(this); }
	public get total(): number { return sumDicePartRolls(this.rolls); }
	//#endregion

	//#region flags
	public get isMax(): boolean { return this.total === this.dice.max; }
	public get isMin(): boolean { return this.total === this.dice.min; }
	//#endregion

	//#region RollBase
	private _dice?: U;
	public get dice(): U {
		if (!this._dice) {
			const fromCore = (<typeof DiceRoll>this.constructor).Dice.fromCore;
			this._dice = <U>fromCore(this.core.dice);
		}
		return this._dice;
	}
	public get hasSecret(): boolean {
		return this.dice.hasSecret;
	}
	private _rolls?: V[];
	public get rolls(): V[] {
		if (!this._rolls) {
			const fromCore = (<typeof DiceRoll>this.constructor).Dice.Part.Roll.fromCore;
			this._rolls = <V[]>this.core.rolls.map(fromCore);
		}
		return this._rolls;
	}
	//#region toString
	protected _toString(renderer: TDicePartRollToString, hideRolls: boolean, rollem = false): string {
		const xxs = this.toStringXXS(hideRolls);
		const desc = this.dice.diceParts.find(dp => dp.hasDescription)?.description;
		const description = this.rolls.map((roll, index) => renderer(roll, index, hideRolls, rollem)).join(" ");
		if (rollem) {
			const stripped = xxs.replace(/<\/?(b|em|i|strong)>/ig, "");
			const output = desc
				? `'${desc}', \` ${stripped} \` ${UNICODE_LEFT_ARROW} ${description.replace(desc, "")}`
				: `\` ${stripped} \` ${UNICODE_LEFT_ARROW} ${description}`;
			return cleanWhitespace(output);
		}else {
			const output = desc
				? `${xxs} \`${desc}\` ${UNICODE_LEFT_ARROW} ${description.replace(desc, "")}`
				: `${xxs} ${UNICODE_LEFT_ARROW} ${description}`;
			return cleanWhitespace(output);
		}
	}
	protected toStringXS(hideRolls: boolean): string {
		const xxs = this.toStringXXS(hideRolls);
		const desc = this.dice.diceParts.find(dp => dp.hasDescription)?.description;
		const output = desc
			? `${xxs} \`${desc ?? ""}\``
			: xxs;
		return cleanWhitespace(output);
	}
	protected toStringXXS(hideRolls: boolean): string {
		const gradeEmoji = gradeToEmoji(this.grade),
			total = hideRolls ? `||${diceTotalToString(this.total)}||` : diceTotalToString(this.total),
			output = `${hideRolls ? ":question:" : gradeEmoji ?? ""} ${total}`;
		return cleanWhitespace(output);
	}
	public toString(): string;
	public toString(hideRolls: boolean): string;
	public toString(outputType: DiceOutputType): string;
	public toString(outputType: DiceOutputType, hideRolls: boolean): string;
	public toString(hideRolls: boolean, outputType: DiceOutputType): string;
	public toString(...args: (boolean | DiceOutputType)[]): string {
		const hideRolls = <boolean>args.find(arg => arg === true || arg === false) ?? false;
		const outputType = <DiceOutputType>args.find(arg => !!(DiceOutputType[<DiceOutputType>arg] ?? false)) ?? DiceOutputType.M;
		switch (outputType) {
			case DiceOutputType.ROLLEM: return this._toString(mapDicePartRollToStringWithDice, hideRolls, true);
			case DiceOutputType.XXL: return this._toString(mapDicePartRollToStringWithDice, hideRolls);
			case DiceOutputType.XL: return this._toString(mapDicePartRollToStringWithDice, hideRolls);
			case DiceOutputType.L: return this._toString(mapDicePartRollToStringWithoutDice, hideRolls);
			case DiceOutputType.M: return this._toString(mapDicePartRollToStringWithDice, hideRolls);
			case DiceOutputType.S: return this._toString(mapDicePartRollToStringWithoutDice, hideRolls);
			case DiceOutputType.XS: return this.toStringXS(hideRolls);
			case DiceOutputType.XXS: return this.toStringXXS(hideRolls);
			default: {
				console.warn(`DiceRoll.toString(${args})`);
				return this.toString(DiceOutputType.M, hideRolls);
			}
		}
	}
	//#endregion
	//#endregion

	//#region static
	public static create(_dice: TDice, uuid: boolean): TDiceRoll {
		const core: DiceRollCore = {
			objectType: "DiceRoll",
			gameType: GameType.None,
			//Quick rolls can never be reloaded, so we don't need a UUID
			id: uuid ? generate() : null!,
			dice: _dice.toJSON(),
			rolls: _dice.diceParts.map<DicePartRollCore>(mapRollToJson)
		};
		return new DiceRoll(core);
	}
	public static fromCore(core: DiceRollCore): TDiceRoll {
		return new DiceRoll(core);
	}
	public static Dice = Dice;
	//#endregion
}

Dice.Roll = DiceRoll;

//#endregion

//#region DiceGroup

function isTestOrTarget(currentToken: TToken): boolean {
	return ["test","target"].includes(currentToken.type);
}

function shouldStartNewPart(currentPart: TToken[], currentToken: TToken): boolean {
	return !currentPart || ["dice","mod","test"].includes(currentToken.type);
}

export class DiceGroup<T extends DiceGroupCore, U extends TDice, V extends TDiceGroupRoll> extends HasDieCore<T> implements IDiceBase<V> {
	//#region from this.core
	public get critMethodType(): OrUndefined<CritMethodType> {
		return this.core.critMethodType;
	}
	private _dice?: U[];
	public get dice(): U[] {
		if (!this._dice) {
			const fromCore = (<typeof DiceGroup>this.constructor).Part.fromCore;
			this._dice = <U[]>this.core.dice.map(fromCore);
		}
		return this._dice;
	}
	public get diceOutputType(): OrUndefined<DiceOutputType> {
		return this.core.diceOutputType;
	}
	public get diceSecretMethodType(): OrUndefined<DiceSecretMethodType> {
		return this.core.diceSecretMethodType;
	}
	//#endregion

	//#region IHasDieCore
	public get hasSecret(): boolean {
		return this.dice.find(_dice => _dice.hasSecret) !== undefined
			&& (this.diceSecretMethodType ?? DiceSecretMethodType.Ignore) !== DiceSecretMethodType.Ignore;
	}
	//#endregion

	//#region DiceBase
	public roll(): V {
		const _constructor = <typeof DiceGroup>this.constructor;
		return <V>_constructor.Roll.create(this, true);
	}
	public toString(outputType?: DiceOutputType): string {
		return `[${this.dice.map(_dice => _dice.toString(outputType)).join("; ")}]`;
	}
	//#endregion

	//#region static
	public static create(_dice: TDice[], diceOutputType?: DiceOutputType, diceSecretMethodType?: DiceSecretMethodType, critMethodType?: number): TDiceGroup {
		return new DiceGroup({
			objectType: "DiceGroup",
			gameType: GameType.None,
			id: generate(),
			critMethodType: critMethodType,
			dice: _dice.map<DiceCore>(toJSON),
			diceOutputType: diceOutputType,
			diceSecretMethodType: diceSecretMethodType
		});
	}
	public static fromCore(core: DiceGroupCore): TDiceGroup {
		return new DiceGroup(core);
	}
	public static fromTokens(tokens: TToken[], diceOutputType?: DiceOutputType, diceSecretMethodType?: DiceSecretMethodType, critMethodType?: number): TDiceGroup {
		let currentPart: TToken[];
		const partedTokens: TToken[][] = [];
		tokens.forEach(token => {
			if (shouldStartNewPart(currentPart, token)) {
				currentPart = [];
				partedTokens.push(currentPart);
			}
			currentPart.push(token);
			if (isTestOrTarget(token)) {
				currentPart = [];
				partedTokens.push(currentPart);
			}
		});
		const diceParts = partedTokens.filter(array => array.length).map(DicePart.fromTokens);

		let currentDice: TDicePart[];
		const partedDice: TDicePart[][] = [];
		diceParts.forEach(dicePart => {
			if (!currentDice
				|| dicePart.hasDie && !dicePart.sign
				|| dicePart.hasTest && currentDice.find(_dicePart => _dicePart.hasTest)) {
				currentDice = [];
				partedDice.push(currentDice);
			}
			currentDice.push(dicePart);
			//TODO: After a test, wee need to start another dicepart ... Or a test becomes its own dicepart
		});
		const _dice = partedDice.map(Dice.create);

		return DiceGroup.create(_dice, diceOutputType, diceSecretMethodType, critMethodType);
	}
	public static parse(diceString: string, diceOutputType?: DiceOutputType, diceSecretMethodType?: DiceSecretMethodType): TDiceGroup {
		const tokens = Tokenizer.tokenize(diceString, getParsers(), "desc");
		return DiceGroup.fromTokens(tokens, diceOutputType, diceSecretMethodType);
	}
	public static Part = Dice;
	public static Roll: typeof DiceGroupRoll;
	//#endregion
}

//#endregion

//#region DiceGroupRoll

export class DiceGroupRoll<T extends DiceGroupRollCore, U extends TDiceGroup, V extends TDiceRoll> extends HasDieCore<T> implements IRollBase<U, TDiceRoll> {
	//#region RollBase

	private _dice?: U;
	public get dice(): U {
		if (!this._dice) {
			const fromCore = (<typeof DiceGroupRoll>this.constructor).Dice.fromCore;
			this._dice = <U>fromCore(this.core.diceGroup);
		}
		return this._dice;
	}

	public get hasSecret(): boolean {
		return this.dice.hasSecret;
	}

	private _rolls?: V[];
	public get rolls(): V[] {
		if (!this._rolls) {
			const fromCore = (<typeof DiceGroupRoll>this.constructor).Dice.Part.Roll.fromCore;
			this._rolls = <V[]>this.core.rolls.map(fromCore);
		}
		return this._rolls;
	}

	public toString(outputType?: DiceOutputType, inline = false): string {
		let _outputType = this.dice.diceOutputType ?? outputType ?? DiceOutputType.M;
		if (inline) {
			_outputType = <DiceOutputType>Math.min(_outputType, DiceOutputType.M);
		}
		const joiner = _outputType < DiceOutputType.L ? "; " : "\n";
		const output: string[] = [];
		for (const roll of this.rolls) {
			output.push(roll.toString(_outputType));
			const grade = roll.grade;
			if (grade && grade !== DieRollGrade.CriticalSuccess && grade !== DieRollGrade.Success) {
				break;
			}
		}
		return output.join(joiner);
	}

	//#endregion

	//#region static
	public static create(diceGroup: TDiceGroup, uuid: boolean): TDiceGroupRoll {
		return new DiceGroupRoll({
			objectType: "DiceGroupRoll",
			gameType: GameType.None,
			//Quick rolls can never be reloaded, so we don't need a UUID
			id: uuid ? generate() : null!,
			diceGroup: diceGroup.toJSON(),
			rolls: diceGroup.dice.map<DiceRollCore>(mapRollToJson)
		});
	}
	public static fromCore(core: DiceGroupRollCore): TDiceGroupRoll {
		return new DiceGroupRoll(core);
	}
	public static Dice = DiceGroup;
	//#endregion
}

DiceGroup.Roll = DiceGroupRoll;

//#endregion
