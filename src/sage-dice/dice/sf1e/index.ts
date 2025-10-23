import { GameType } from "@rsc-sage/types";
import { mapFirst, numberOrUndefined, randomSnowflake, type OrNull, type OrUndefined } from "@rsc-utils/core-utils";
import { tokenize, type TokenData, type TokenParsers } from "@rsc-utils/string-utils";

import {
	CritMethodType, DiceOutputType,
	DiceSecretMethodType,
	DieRollGrade,
	TestType,
	cleanDescription,
	createValueTestData,
	gradeRoll, isGradeSuccess,
	parseTestTargetValue,
	parseTestType,
	type TDiceLiteral,
	type TTestData
} from "../../common.js";
import {
	Dice as baseDice, DiceGroup as baseDiceGroup,
	DiceGroupRoll as baseDiceGroupRoll, DicePart as baseDicePart,
	DicePartRoll as baseDicePartRoll, DiceRoll as baseDiceRoll, getParsers as baseGetParsers, reduceTokenToDicePartCore as baseReduceTokenToDicePartCore
} from "../base/index.js";
import type {
	DiceCore as baseDiceCore, DiceGroupCore as baseDiceGroupCore,
	DiceGroupRollCore as baseDiceGroupRollCore, DicePartCore as baseDicePartCore,
	DicePartRollCore as baseDicePartRollCore, DiceRollCore as baseDiceRollCore, TDicePartCoreArgs as baseTDicePartCoreArgs
} from "../base/types.js";

//#region Tokenizer

const Sf1eParsers = {
	crits: /crit\s*(?:(\d+)\+?)?\s*(?:x(\d+))?/i,
	target: /(ac|eac|kac|dc)\s*(\d+|\|\|\d+\|\|)/i,
};

let _parsers: TokenParsers;
function getParsers(): TokenParsers {
	return _parsers ??= { ...baseGetParsers(), ...Sf1eParsers };
}

function reduceTokenToDicePartCore<T extends DicePartCore>(core: T, token: TokenData, index: number, tokens: TokenData[]): T {
	if (token.key === "target") {
		core.target = parseTargetData(token);
		return core;
	}
	return baseReduceTokenToDicePartCore(core, token, index, tokens);
}

//#endregion

//#region Targets/Tests
export enum TargetType { None = 0, AC = 1, DC = 2, EAC = 3, KAC = 4 }
export type TTargetData = { type:TargetType; value:number; hidden:boolean; raw:string; };
function parseTargetType(targetType: string): TargetType {
	const targetTypeLower = targetType.toLowerCase();
	if (targetTypeLower.endsWith("eac")) {
		return TargetType.EAC;
	}else if (targetTypeLower.endsWith("kac")) {
		return TargetType.KAC;
	}else if (targetTypeLower.endsWith("ac")) {
		return TargetType.AC;
	}else if (targetTypeLower.endsWith("dc")) {
		return TargetType.DC;
	}else {
		return TargetType.None;
	}
}

function parseTargetData(token: TokenData): OrUndefined<TTargetData> {
	if (token.matches) {
		const type = parseTargetType(token.matches[0]);
		const { value = 0, hidden = false } = type ? parseTestTargetValue(token.matches[1]) : { };
		return { type, value, hidden, raw:token.token };
	}
	return undefined;
}

function targetDataToTestData(targetData: TTargetData | TTestData): OrUndefined<TTestData> {
	if (targetData) {
		const alias = (<TTestData>targetData).alias;
		if (alias) {
			const testType = parseTestType(alias);
			if (testType) {
				return createValueTestData(testType, targetData.value, targetData.hidden);
			}
		}
		return createValueTestData(TestType.GreaterThanOrEqual, targetData.value, targetData.hidden, TargetType[targetData.type].toLowerCase());
	}
	return undefined;
}
//#endregion

//#region Grades

const AC_REGEX = /ac/i;
const DC_REGEX = /dc/i;
function gradeResults(roll: DiceRoll): DieRollGrade {
	const successOrFailure = gradeRoll(roll);

	const alias = roll.dice.test?.alias;

	if (alias?.match(AC_REGEX)) {
		const d20 = roll.rolls.find(dpr => dpr.dice.sides === 20);
		if (d20?.isMin) return DieRollGrade.CriticalFailure;
		const critMin = roll.dice.critData?.min ?? 20;
		if (d20?.rolls[0]! >= critMin) {
			if (successOrFailure === DieRollGrade.Success) return DieRollGrade.CriticalSuccess;
			return DieRollGrade.Success;
		}
	}

	if (alias?.match(DC_REGEX)) {
		if (roll.hasSave) {
			if (roll.isMax) {
				return DieRollGrade.CriticalSuccess;
			}else if (roll.isMin) {
				return DieRollGrade.CriticalFailure;
			}
		}
	}

	return successOrFailure;
}

//#endregion

//#region diceGroupRollToString

function diceGroupRollToString(diceGroupRoll: DiceGroupRoll, outputType: DiceOutputType, joiner = "\n", diceSort?: "noSort" | "sort"): string {
	const rollOutputs: string[] = [];
	const { attack, damage } = diceGroupRoll.attackDamageRoll ?? { };
	let breakOut = false;
	let skipDamage = false;
	const { rolls } = diceGroupRoll;
	for (const roll of rolls) {
		let dmgEmoji = "";

		// if attack dice, we might stop showing subsequent rolls, including damage
		if (attack && roll.is(attack)) {
			skipDamage = !isGradeSuccess(roll.grade ?? DieRollGrade.Unknown);

		// if the first test fails, stop showing subsequent rolls
		}else if (roll.dice.hasTest) {
			breakOut = !isGradeSuccess(roll.grade ?? DieRollGrade.Unknown);

		}else {
			if (damage && roll.is(damage)) {
				if (skipDamage) continue;
				dmgEmoji = attack?.grade ? `[damage] ` : ``;
			}
		}

		rollOutputs.push(dmgEmoji + roll.toString(outputType, diceSort));

		if (breakOut) {
			break;
		}
	}
	return rollOutputs.join(joiner);
}
//#endregion

//#region DicePart
interface DicePartCore extends baseDicePartCore {
	target?: TTargetData;
}
type TDicePartCoreArgs = baseTDicePartCoreArgs & {
	testOrTarget?: TTestData | TTargetData;
};
const SAVE_REGEX = /\b(fort(itude)?|ref(flex)?|will(power)?|save)\b/i;
export class DicePart extends baseDicePart<DicePartCore, DicePartRoll> {
	//#region flags
	public get hasAcTarget(): boolean {
		return this.core.target?.type === TargetType.EAC
			|| this.core.target?.type === TargetType.KAC
			|| this.core.target?.type === TargetType.AC;
	}
	public get hasSave(): boolean {
		return this.description.match(SAVE_REGEX) !== null;
	}
	//#endregion

	//#region static
	public static create({ count, sides, dropKeep, noSort, modifier, sign, description, testOrTarget, fixedRolls }: TDicePartCoreArgs = {}): DicePart {
		return new DicePart({
			objectType: "DicePart",
			gameType: GameType.SF1e,
			id: randomSnowflake(),

			count: count ?? 0,
			description: cleanDescription(description),
			dropKeep: dropKeep,
			fixedRolls,
			modifier: modifier ?? 0,
			noSort: noSort === true,
			sides: sides ?? 0,
			sign: sign,
			test: targetDataToTestData(<TTargetData>testOrTarget) ?? <TTestData>testOrTarget,
			target: <TTargetData>testOrTarget
		});
	}
	public static fromCore(core: DicePartCore): DicePart {
		return new DicePart(core);
	}
	public static fromTokens(tokens: TokenData[]): DicePart {
		const core = tokens.reduce(reduceTokenToDicePartCore, <DicePartCore>{ description:"" });
		const args = <TDicePartCoreArgs>{ testOrTarget:core.target ?? core.test, ...core };
		return DicePart.create(args);
	}
	//#endregion
}
//#endregion

//#region DicePartRoll
type DicePartRollCore = baseDicePartRollCore;
export class DicePartRoll extends baseDicePartRoll<DicePartRollCore, DicePart> {
	//#region static
	public static create(dicePart: DicePart): DicePartRoll {
		return new DicePartRoll(this._createCore(dicePart, GameType.SF1e));
	}
	public static fromCore(core: DicePartRollCore): DicePartRoll {
		return new DicePartRoll(core);
	}
	public static Dice = <typeof baseDicePart>DicePart;
	//#endregion
}
DicePart.Roll = <typeof baseDicePartRoll>DicePartRoll;
//#endregion

//#region Dice
type DiceCore = baseDiceCore;
export class Dice extends baseDice<DiceCore, DicePart, DiceRoll> {
	public get critData() {
		const match = mapFirst(this.diceParts, dicePart => dicePart.description.match(Sf1eParsers.crits));
		if (!match) return null;

		const [_, minRoll, multiplier] = match;
		const min = numberOrUndefined(minRoll) ?? 20;
		const multi = numberOrUndefined(multiplier) ?? 2;
		return { min, multi };
	}
	public get hasAcTarget(): boolean {
		return this.diceParts.some(dicePart => dicePart.hasAcTarget);
	}
	public get hasSave(): boolean {
		return this.diceParts.find(dicePart => dicePart.hasSave) !== undefined;
	}

	//#region static
	public static create(diceParts: DicePart[]): Dice {
		return new Dice({
			objectType: "Dice",
			gameType: GameType.SF1e,
			id: randomSnowflake(),
			diceParts: diceParts.map<DicePartCore>(Dice.toJSON)
		});
	}
	public static fromCore(core: DiceCore): Dice {
		return new Dice(core);
	}
	public static fromDicePartCores(dicePartCores: DicePartCore[]): Dice {
		return Dice.create(dicePartCores.map(DicePart.fromCore));
	}
	public static parse(diceString: string): Dice {
		const diceGroup = DiceGroup.parse(diceString);
		return diceGroup && diceGroup.dice[0] || null;
	}
	public static roll(diceString: TDiceLiteral): number;
	public static roll(diceString: string): OrNull<number>;
	public static roll(diceString: string): OrNull<number> {
		const _dice = Dice.parse(diceString);
		return _dice?.quickRoll() ?? null;
	}

	public static Part = <typeof baseDicePart>DicePart;
	//#endregion
}
//#endregion

//#region DiceRoll
type DiceRollCore = baseDiceRollCore;
export class DiceRoll extends baseDiceRoll<DiceRollCore, Dice, DicePartRoll> {
	//#region calculated
	public get grade(): DieRollGrade { return gradeResults(this); }
	public get hasSave(): boolean {
		return this.dice.hasSave;
	}
	//#endregion

	//#region static
	public static create(_dice: Dice): DiceRoll {
		return new DiceRoll({
			objectType: "DiceRoll",
			gameType: GameType.SF1e,
			id: randomSnowflake(),
			dice: _dice.toJSON(),
			rolls: _dice.diceParts.map(dicePart => dicePart.roll().toJSON())
		});
	}
	public static fromCore(core: DiceRollCore): DiceRoll {
		return new DiceRoll(core);
	}
	public static Dice = <typeof baseDice>Dice;
	//#endregion
}
Dice.Roll = <typeof baseDiceRoll>DiceRoll;
//#endregion

//#region DiceGroup
function isTestOrTarget(currentToken: TokenData): boolean {
	return ["test","target"].includes(currentToken.key);
}
function shouldStartNewPart(currentPart: TokenData[], currentToken: TokenData): boolean {
	return !currentPart || ["dice","mod","test","target"].includes(currentToken.key);
}

interface DiceGroupCore extends baseDiceGroupCore {
	critMethodType?: CritMethodType;
}
export class DiceGroup extends baseDiceGroup<DiceGroupCore, Dice, DiceGroupRoll> {
	public get critMethodType(): CritMethodType { return this.core.critMethodType ?? CritMethodType.Unknown; }

	//#region attack / damage
	public get hasAttackAndDamage(): boolean {
		return this.attackDamageDice !== undefined;
	}
	public get attackDamageDice(): { attack:Dice; damage:Dice; } | undefined {
		let attack: Dice | undefined;
		for (const dice of this.dice) {
			// find damage after attack
			if (attack) {
				if (!dice.isD20 && !dice.hasTest) {
					return { attack, damage:dice };
				}

			// let's find attack
			}else if (dice.isD20 && dice.hasAcTarget) {
				attack = dice;

			}
		}
		return undefined;
	}

	public toString(outputType?: DiceOutputType): string {
		return `[${this.dice.map(_dice => _dice.toString(outputType)).join("; ")}]`;
	}

	//#region static
	public static create(_dice: Dice[], diceOutputType?: DiceOutputType, diceSecretMethodType?: DiceSecretMethodType, critMethodType = CritMethodType.Unknown): DiceGroup {
		return new DiceGroup({
			objectType: "DiceGroup",
			gameType: GameType.SF1e,
			id: randomSnowflake(),
			critMethodType: critMethodType,
			dice: _dice.map<DiceCore>(DiceGroup.toJSON),
			diceOutputType: diceOutputType,
			diceSecretMethodType: diceSecretMethodType
		});
	}
	public static fromCore(core: DiceGroupCore): DiceGroup {
		return new DiceGroup(core);
	}
	public static fromTokens(tokens: TokenData[], diceOutputType?: DiceOutputType, diceSecretMethodType?: DiceSecretMethodType, critMethodType?: CritMethodType): DiceGroup {
		let currentPart: TokenData[];
		const partedTokens: TokenData[][] = [];
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

		let currentDice: DicePart[];
		const partedDice: DicePart[][] = [];
		diceParts.forEach(dicePart => {
			if (!currentDice
				|| dicePart.hasDie && !dicePart.sign
				|| dicePart.hasTest && currentDice.find(_dicePart => _dicePart.hasTest)) {
				currentDice = [];
				partedDice.push(currentDice);
			}
			currentDice.push(dicePart);
		});

		partedDice.forEach(_diceParts => {
			if (_diceParts.length === 1) {
				const _dicePart = _diceParts[0];
				if (_dicePart.hasTest && _dicePart.isEmpty) {
					const _core = _dicePart.toJSON();
					_core.count = 1;
					_core.sides = 20;
				}
			}
		});

		const _dice = partedDice.map(Dice.create);
		return DiceGroup.create(_dice, diceOutputType, diceSecretMethodType, critMethodType);
	}
	public static parse(diceString: string, diceOutputType?: DiceOutputType, diceSecretMethodType?: DiceSecretMethodType, critMethodType?: CritMethodType): DiceGroup {
		const tokens = tokenize(diceString, getParsers(), "desc");
		return DiceGroup.fromTokens(tokens, diceOutputType, diceSecretMethodType, critMethodType);
	}
	public static Part = <typeof baseDice>Dice;
	public static Roll: typeof baseDiceGroupRoll;
	//#endregion
}
//#endregion

//#region DiceGroupRoll
function createDiceGroupRoll(diceGroup: DiceGroup): DiceGroupRoll {
	const core: DiceGroupRollCore = {
		objectType: "DiceGroupRoll",
		gameType: GameType.SF1e,
		id: randomSnowflake(),
		diceGroup: diceGroup.toJSON(),
		rolls: diceGroup.dice.map(_dice => _dice.roll().toJSON())
	};
	const diceGroupRoll = new DiceGroupRoll(core);
	manipulateDamage(diceGroupRoll);
	return diceGroupRoll;
}
function manipulateDamage(diceGroupRoll: DiceGroupRoll): void {
	if (diceGroupRoll.hasAttackAndDamage) {
		manipulateCriticalDamage(diceGroupRoll);
	}
}

function critByTimesTwo(diceGroupRoll: DiceGroupRoll): void {
	const critDicePart = DicePart.create({ modifier: 2, sign: "*", description: "<i>(crit)</i>" });
	diceGroupRoll.dice.attackDamageDice?.damage.diceParts.push(critDicePart);
	diceGroupRoll.attackDamageRoll?.damage.toJSON().rolls.push(critDicePart.roll().toJSON());
}
function critByRollingTwice(diceGroupRoll: DiceGroupRoll): void {
	const damageDice = diceGroupRoll.dice.attackDamageDice?.damage!;
	const damageRoll = diceGroupRoll.attackDamageRoll?.damage!;
	damageDice.diceParts.forEach((dicePart, index) => {
		if (dicePart.hasDie) {
			damageRoll.toJSON().rolls[index].rolls.push(...dicePart.roll().rolls);
			dicePart.toJSON().count *= 2;
		}else if (dicePart.modifier) {
			dicePart.toJSON().modifier! *= 2;
		}
	});

	const critDicePart = DicePart.create({ description: "<i>(crit; roll 2x)</i>" });
	damageDice.diceParts.push(critDicePart);
	damageRoll.toJSON().rolls.push(critDicePart.roll().toJSON());
}
function critByAddingMax(diceGroupRoll: DiceGroupRoll): void {
	const critDicePart = DicePart.create({ modifier: diceGroupRoll.attackDamageRoll?.damage!.dice.max, sign: "+", description: "<i>(crit; add max)</i>" });
	diceGroupRoll.dice.attackDamageDice!.damage.diceParts.push(critDicePart);
	diceGroupRoll.attackDamageRoll!.damage.toJSON().rolls.push(critDicePart.roll().toJSON());
}

function manipulateCriticalDamage(diceGroupRoll: DiceGroupRoll): void {
	if (diceGroupRoll.hasAttackCriticalSuccess) {
		const critMethodType = diceGroupRoll.dice.critMethodType;
		if (critMethodType === CritMethodType.AddMax) {
			critByAddingMax(diceGroupRoll);
		} else if (critMethodType === CritMethodType.RollTwice) {
			critByRollingTwice(diceGroupRoll);
		}else {
			critByTimesTwo(diceGroupRoll);
		}
	}
}

type DiceGroupRollCore = baseDiceGroupRollCore;
export class DiceGroupRoll extends baseDiceGroupRoll<DiceGroupRollCore, DiceGroup, DiceRoll> {
	public get attackDamageRoll(): { attack:DiceRoll; damage:DiceRoll; } | undefined {
		const { attackDamageDice } = this.dice;
		if (attackDamageDice) {
			const { attack, damage } = attackDamageDice;
			return {
				attack: DiceRoll.fromCore(this.core.rolls.find(rollCore => attack.is(rollCore.dice))!),
				damage: DiceRoll.fromCore(this.core.rolls.find(rollCore => damage.is(rollCore.dice))!),
			};
		}
		return undefined;
	}

	//#region convenience / flags
	public get hasAttackAndDamage(): boolean {
		return this.dice.hasAttackAndDamage;
	}
	public get hasAttackCriticalSuccess(): boolean {
		return this.attackDamageRoll?.attack?.grade === DieRollGrade.CriticalSuccess;
	}
	//#endregion

	public toString(): string;
	public toString(outputType: DiceOutputType): string;
	public toString(outputType: DiceOutputType, inline: boolean): string;
	public toString(outputType: DiceOutputType, noSort: "noSort" | "sort"): string;
	public toString(...args: (DiceOutputType | boolean | "noSort" | "sort")[]): string {
		const outputType = args.find(arg => typeof(arg) === "number") as DiceOutputType;
		const inline = args.find(arg => typeof(arg) === "boolean");
		const noSort = args.find(arg => arg === "noSort" || arg === "sort") as "noSort" | "sort";

		let _outputType = this.dice.diceOutputType ?? outputType ?? DiceOutputType.M;
		if (inline) {
			_outputType = <DiceOutputType>Math.min(_outputType, DiceOutputType.M);
		}
		const joiner = _outputType < DiceOutputType.L ? "; " : "\n";
		return diceGroupRollToString(this, _outputType, joiner, noSort);
	}

	public static create(diceGroup: DiceGroup): DiceGroupRoll {
		return createDiceGroupRoll(diceGroup);
	}
	public static fromCore(core: DiceGroupRollCore): DiceGroupRoll {
		return new DiceGroupRoll(core);
	}
	public static Dice = <typeof baseDiceGroup>DiceGroup;
}
DiceGroup.Roll = <typeof baseDiceGroupRoll>DiceGroupRoll;
//#endregion
