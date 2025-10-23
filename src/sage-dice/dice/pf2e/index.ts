import { GameType } from "@rsc-sage/types";
import { isDefined, randomSnowflake, type OrNull, type OrUndefined } from "@rsc-utils/core-utils";
import { isGradeFailure } from "@rsc-utils/dice-utils";
import { tokenize, type TokenData, type TokenParsers } from "@rsc-utils/string-utils";
import {
	CritMethodType,
	DiceOutputType,
	DiceSecretMethodType,
	DieRollGrade,
	DropKeepType,
	TestType,
	cleanDescription,
	createValueTestData,
	decreaseGrade,
	gradeRoll, increaseGrade,
	isGradeSuccess,
	parseTestTargetValue,
	parseTestType,
	type TDiceLiteral,
	type TSign,
	type TTestData
} from "../../common.js";
import {
	Dice as baseDice, DiceGroup as baseDiceGroup,
	DiceGroupRoll as baseDiceGroupRoll, DicePart as baseDicePart,
	DicePartRoll as baseDicePartRoll, DiceRoll as baseDiceRoll, getParsers as baseGetParsers, reduceTokenToDicePartCore as baseReduceTokenToDicePartCore,
	type TReduceSignToDropKeep
} from "../base/index.js";
import type {
	DiceCore as baseDiceCore, DiceGroupCore as baseDiceGroupCore,
	DiceGroupRollCore as baseDiceGroupRollCore, DicePartCore as baseDicePartCore,
	DicePartRollCore as baseDicePartRollCore, DiceRollCore as baseDiceRollCore, TDicePartCoreArgs as baseTDicePartCoreArgs
} from "../base/types.js";

//#region Tokenizer

const Pf2eParsers = {
	"special": /(deadly|fatal)\s*\d?d\d+/i,
	"target": /(vs\s*ac|vs\s*dc|ac|dc|vs)\s*(\d+|\|\|\d+\|\|)/i,

	// vs type
	"concealed": /(vs\s*conceal(?:ed|ment)?)/i,
	"deafened": /(vs\s*deaf(?:ened)?)/i,
	"hidden": /(vs\s*hidden)/i,
	"stupefied": /(vs\s*stup[ie]fied)\s*(\d+)/i,
	"undetected": /(vs\s*undetected)/i,

	// vs or just type
	// "concealed": /((?:vs\s*)?conceal(?:ed|ment)?)/i,
	// "deafened": /((?:vs\s*)?deaf(?:ened)?)/i,
	// "hidden": /((?:vs\s*)?hidden)/i,
	// "stupefied": /(vs\s*stup(?:i|e)fied|stup(?:i|e)fied)\s*(\d+)/i,
	// "undetected": /((?:vs\s*)?undetected)/i,
};

let _parsers: TokenParsers;
function getParsers(): TokenParsers {
	return _parsers ??= { ...baseGetParsers(), ...Pf2eParsers };
}

const FORTUNE = "Fortune";
const MISFORTUNE = "Misfortune";
function reduceTokenToDicePartCore<T extends DicePartCore>(core: T, token: TokenData, index: number, tokens: TokenData[]): T {
	if (token.key === "target" || SpecialTestAliases.includes(token.key as TSpecialTestAliasType)) {
		core.target = parseTargetData(token);
		return core;
	}
	const reduceSignToDropKeepData: TReduceSignToDropKeep[] = [];
	if (token.key === "dice") {
		reduceSignToDropKeepData.push(
			{ sign:"+" as TSign, type:DropKeepType.KeepHighest, value:1, alias:FORTUNE, test:_core => _core.count === 2 && _core.sides === 20 && _core.sign === "+" },
			{ sign:"-" as TSign, type:DropKeepType.KeepLowest, value:1, alias:MISFORTUNE, test:_core => _core.count === 2 && _core.sides === 20 && _core.sign === "-" }
		);
	}
	return baseReduceTokenToDicePartCore(core, token, index, tokens, reduceSignToDropKeepData);
}

//#endregion

//#region Targets/Tests
type TSpecialTestAliasType = "concealed" | "deafened" | "hidden" | "stupefied" | "undetected";
const SpecialTestAliases: TSpecialTestAliasType[] = ["deafened", "stupefied", "concealed", "hidden", "undetected"];
export enum TargetType { None = 0, AC = 1, DC = 2, VS = 3, Concealed = 4, Deafened = 5, Hidden = 6, Stupefied = 7, Undetected = 8 }
export type TTargetData = { type:TargetType; value:number; hidden:boolean; raw?:string; };
function parseTargetType(targetType: string): TargetType {
	const targetTypeLower = targetType.toLowerCase();
	if (targetTypeLower.endsWith("ac")) {
		return TargetType.AC;
	}else if (targetTypeLower.endsWith("dc")) {
		return TargetType.DC;
	}else if (targetTypeLower.endsWith("vs")) {
		return TargetType.VS;
	}else if (targetTypeLower.includes("conceal")) {
		return TargetType.Concealed;
	}else if (targetTypeLower.includes("deaf")) {
		return TargetType.Deafened;
	}else if (targetTypeLower.includes("hidden")) {
		return TargetType.Hidden;
	}else if (targetTypeLower.includes("stupefied")) {
		return TargetType.Stupefied;
	}else if (targetTypeLower.includes("undetected")) {
		return TargetType.Undetected;
	}else {
		return TargetType.None;
	}
}
function parseTargetValue(type: TargetType, value: number): number {
	switch (type) {
		case TargetType.AC: return value;
		case TargetType.DC: return value;
		case TargetType.VS: return value;
		case TargetType.Concealed: return 5;
		case TargetType.Deafened: return 5;
		case TargetType.Hidden: return 11;
		case TargetType.Stupefied: return value + 5;
		case TargetType.Undetected: return 11;
		default: return 0;
	}
}
function parseTargetData(token: TokenData): OrUndefined<TTargetData> {
	if (token.matches) {
		const type = parseTargetType(token.matches[0] ?? "");
		let { value, hidden } = parseTestTargetValue(token.matches[1] ?? "");
		value = parseTargetValue(type, value);
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

//#region CONST


//#endregion

//#region Grades

function gradeValue(value: number, target: number): DieRollGrade {
	if (value >= target + 10) {
		return DieRollGrade.CriticalSuccess;
	}else if (value >= target) {
		return DieRollGrade.Success;
	}else if (value <= target - 10) {
		return DieRollGrade.CriticalFailure;
	}
	return DieRollGrade.Failure;
}

const AC_DC_VS_REGEX = /ac|dc|vs/i;
function gradeResults(roll: DiceRoll): DieRollGrade {
	const test = roll.dice.test;
	if (test?.alias?.match(AC_DC_VS_REGEX)) {
		const grade = gradeValue(roll.total, test.value);
		if (roll.isMax) {
			return increaseGrade(grade);
		}else if (roll.isMin) {
			return decreaseGrade(grade);
		}
		return grade;
	}
	return gradeRoll(roll);
}

//#endregion

//#region diceGroupRollToString

/** .push() tested roll (if one exists), and return true if no roll or it succeeded. */
enum SpecialTestResult { Unknown = 0, UndetectedFailure = 1, Failure = 2, Success = 3, UndetectedSuccess = 4 }

/** Iterates all the special test aliases to determine if we ever get to the attack roll.  */
function testSpecialTestAliases(rollOutputs: string[], testRolls: DiceRoll[], attackGrade: DieRollGrade): SpecialTestResult {
	let successful: boolean | undefined;
	let undetected: boolean | undefined;
	const attackFailure = !isGradeSuccess(attackGrade);
	for (const testRoll of testRolls) {
		// const alias = testRoll.dice.diceParts.find(dp => dp.test?.alias)?.test?.alias;
		const isUndetectedTest = testRoll.dice.hasTestAlias("undetected");
		const grade = testRoll.grade;
		const testSuccess = isGradeSuccess(grade);
		const testFailure = isGradeFailure(grade);
		// debug({alias,isUndetectedTest,grade,testSuccess,testFailure})
		const emojiGrade = _gradeEmoji(testSuccess, testFailure, isUndetectedTest ? attackGrade : DieRollGrade.Unknown);
		// we only hide attack rolls if we have an undetected test *AND* an attack grade *AND* either the undetected or attack failed
		const total = isUndetectedTest && attackGrade && (testFailure || attackFailure) ? `||${testRoll.total}||` : testRoll.total;

		/**
		 * @todo: revisit custom success/failure emoji for each special test?
		 * ex: rollOutputs.push(`[${testAlias}${emojiGrade}] ${total} (${testAlias})`);
		 */
		rollOutputs.push(`${emojiGrade} ${total} (${testRoll.dice.test?.alias})`);

		// we only worry about results with grades
		if (attackGrade && grade) {
			successful = testSuccess;
			if (isUndetectedTest) undetected = testSuccess;
			if (!successful) break;
		}
	}

	// success = undefined if no alias tests, otherwise pass/fail; undetected = undefined if no "undetected" alias test, otherwise pass/fail
	if (successful !== undefined) {
		if (undetected !== undefined) {
			return successful ? SpecialTestResult.UndetectedSuccess : SpecialTestResult.UndetectedFailure;
		}
		return successful ? SpecialTestResult.Success : SpecialTestResult.Failure;
	}
	return SpecialTestResult.Unknown;
}

function _gradeEmoji(success: boolean, failure: boolean, attackGrade: DieRollGrade): string {
	if (!attackGrade) {
		if (success) {
			return `[success]`;
		}else if (failure) {
			return `[failure]`;
		}
		return ``;
	}
	return (success && isGradeSuccess(attackGrade)) ? `[success]` : `:question:`;
}

/**
 * Checks to see if an attack's result should be hidden.
 * We only do so if the attack is against an undetected foe and we missed either the attack or the flat check.
 */
function _hideAttackRoll(specialResult: SpecialTestResult, attackGrade: DieRollGrade): boolean {
	if (!attackGrade) return false;
	const undetected = [SpecialTestResult.UndetectedSuccess, SpecialTestResult.UndetectedFailure].includes(specialResult);
	const undetectedSuccess = specialResult === SpecialTestResult.UndetectedSuccess;
	const attackSuccess = isGradeSuccess(attackGrade);
	return undetected && (!undetectedSuccess || !attackSuccess);
}

/**
 * You are not supposed to know if a miss against undetected was due to the flat check or the attack roll.
 * The following logic thus needs to track if a failed test was against "undetected".
 */
function diceGroupRollToString(diceGroupRoll: DiceGroupRoll, outputType: DiceOutputType, joiner = "\n", diceSort?: "noSort" | "sort"): string {
	const rollOutputs: string[] = [];

	const { attack, damage } = diceGroupRoll.attackDamageRoll ?? { };
	const attackGrade = attack?.grade ?? DieRollGrade.Unknown;

	let breakOut = false;
	let skipAttack = false;
	let hideAttack = false;
	let skipDamage = false;
	const specialTestRolls: DiceRoll[] = [];
	const otherRolls: DiceRoll[] = [];
	diceGroupRoll.rolls.forEach(roll => roll.dice.hasSpecialTest ? specialTestRolls.push(roll) : otherRolls.push(roll));
	// const [specialTestRolls, otherRolls] = partition(diceGroupRoll.rolls, roll => roll.dice.hasSpecialTest ? 0 : 1);
	const specialTestResults = testSpecialTestAliases(rollOutputs, specialTestRolls, attackGrade);
	for (const roll of otherRolls) {
		// if attack dice, we might stop showing subsequent rolls, including damage
		if (attack && roll.is(attack)) {
			skipAttack = specialTestResults === SpecialTestResult.Failure;
			hideAttack = _hideAttackRoll(specialTestResults, attackGrade);
			skipDamage = attackGrade ? hideAttack || isGradeFailure(attackGrade) : false;
			if (!skipAttack)
				rollOutputs.push(roll.toString(outputType, hideAttack, diceSort));

		// if the first test fails, stop showing subsequent rolls
		}else if (roll.dice.hasTest) {
			breakOut = !isGradeSuccess(roll.grade ?? DieRollGrade.Unknown);
			rollOutputs.push(roll.toString(outputType, diceSort));

		}else if (damage && roll.is(damage)) {
			if (skipAttack || skipDamage) continue;
			const dmgEmoji = attack?.grade ? `[damage] ` : ``;
			rollOutputs.push(dmgEmoji + roll.toString(outputType, diceSort));

		}else {
			rollOutputs.push(roll.toString(outputType, diceSort));

		}

		if (breakOut) {
			break;
		}
	}
	return rollOutputs.join(joiner);
}
//#endregion

//#region increaseDieSize
function increaseDieSize(sides: number): number {
	const damageDieSides = [4, 6, 8, 10, 12];
	const index = damageDieSides.indexOf(sides);
	return damageDieSides[index + 1] ?? 12;
}
//#endregion

//#region mapFirst
function mapFirst<T, U>(array: T[], mapper: (o: T, i: number, a: T[]) => U): OrUndefined<U> {
	for (let i = 0; i < array.length; i++) {
		const result = mapper(array[i], i, array);
		if (isDefined(result)) {
			return result;
		}
	}
	return undefined;
}
//#endregion

//#region DicePart
interface DicePartCore extends baseDicePartCore {
	target?: TTargetData;
}
type TDicePartCoreArgs = baseTDicePartCoreArgs & {
	testOrTarget?: TTestData | TTargetData;
};
export class DicePart extends baseDicePart<DicePartCore, DicePartRoll> {
	//#region flags
	public get hasFortune(): boolean {
		return this.dropKeep?.alias === FORTUNE;
	}
	public get hasMisfortune(): boolean {
		return this.dropKeep?.alias === MISFORTUNE;
	}
	public get hasAcTarget(): boolean {
		return this.core.target?.type === TargetType.AC;
	}
	public get hasSpecialTest(): boolean {
		return SpecialTestAliases.includes(this.core.test?.alias as TSpecialTestAliasType);
	}
	//#endregion

	//#region static
	public static create({ count, sides, dropKeep, noSort, modifier, sign, description, testOrTarget, fixedRolls }: TDicePartCoreArgs = {}): DicePart {
		return new DicePart({
			objectType: "DicePart",
			gameType: GameType.PF2e,
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
		return new DicePartRoll(this._createCore(dicePart, GameType.PF2e));
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
const DEADLY_REGEX = /deadly\s*\d?d(\d+)/i;
const FATAL_REGEX = /fatal\s*\d?d(\d+)/i;
const STRIKING_REGEX = /striking/i;
const GREATER_STRIKING_REGEX = /greater\s*striking/i
const MAJOR_STRIKING_REGEX = /major\s*striking/i
const GREATER_OR_MAJOR_STRIKING_REGEX = /(greater|major)\s*striking/i
type DiceCore = baseDiceCore;
export class Dice extends baseDice<DiceCore, DicePart, DiceRoll> {
	//#region calculated
	public get deadlyDie(): OrNull<number> {
		const deadlyDieMatch = mapFirst(this.diceParts, dicePart => dicePart.description.match(DEADLY_REGEX)) ?? [];
		return +deadlyDieMatch[1] || null;
	}
	public get fatalDie(): OrNull<number> {
		const fatalDieMatch = mapFirst(this.diceParts, dicePart => dicePart.description.match(FATAL_REGEX)) ?? [];
		return +fatalDieMatch[1] || null;
	}
	//#endregion

	//#region flags
	public get hasAcTarget(): boolean {
		return this.diceParts.some(dicePart => dicePart.hasAcTarget);
	}
	public get hasSpecialTest(): boolean {
		return SpecialTestAliases.some(alias => this.hasTestAlias(alias));
	}
	public get isDeadly(): boolean {
		return this.deadlyDie !== null;
	}
	public get isFatal(): boolean {
		return this.fatalDie !== null;
	}
	private _hasStriking(posRegex: RegExp, negRegex?: RegExp): boolean {
		return this.diceParts.some(({description}) => posRegex.test(description) && !negRegex?.test(description));
	}
	public get hasStriking(): boolean {
		return this._hasStriking(STRIKING_REGEX);
	}
	public get isStriking(): boolean {
		return this._hasStriking(STRIKING_REGEX, GREATER_OR_MAJOR_STRIKING_REGEX);
	}
	public get isGreaterStriking(): boolean {
		return this._hasStriking(GREATER_STRIKING_REGEX);
	}
	public get isMajorStriking(): boolean {
		return this._hasStriking(MAJOR_STRIKING_REGEX);
	}
	public get strikingType(): StrikingType {
		return this.isMajorStriking && StrikingType.Major
			|| this.isGreaterStriking && StrikingType.Greater
			|| this.isStriking && StrikingType.Striking
			|| StrikingType.None;
	}
	//#endregion

	//#region methods
	public hasTestAlias(alias: string): boolean {
		return this.test?.alias === alias;
	}
	//#endregion

	//#region static
	public static create(diceParts: DicePart[]): Dice {
		return new Dice({
			objectType: "Dice",
			gameType: GameType.PF2e,
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
	//#region from this.dice
	public get deadlyDie(): OrNull<number> { return this.dice.deadlyDie; }
	public get fatalDie(): OrNull<number> { return this.dice.fatalDie; }
	//#endregion

	//#region calculated
	public get grade(): DieRollGrade { return gradeResults(this); }
	//#endregion

	//#region flags
	public get isDeadly(): boolean { return this.dice.isDeadly; }
	public get isFatal(): boolean { return this.dice.isFatal; }
	public get isGreaterStriking(): boolean { return this.dice.isGreaterStriking; }
	public get isMajorStriking(): boolean { return this.dice.isMajorStriking; }
	public get isStriking(): boolean { return this.dice.isStriking; }
	//#endregion

	//#region static
	public static create(_dice: Dice): DiceRoll {
		return new DiceRoll({
			objectType: "DiceRoll",
			gameType: GameType.PF2e,
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
	return ["test","target"].concat(SpecialTestAliases).includes(currentToken.key);
}
function shouldStartNewPart(currentPart: TokenData[], currentToken: TokenData): boolean {
	return !currentPart || ["dice","mod","test","target"].concat(SpecialTestAliases).includes(currentToken.key);
}

interface DiceGroupCore extends baseDiceGroupCore {
	critMethodType?: CritMethodType;
}
export class DiceGroup extends baseDiceGroup<DiceGroupCore, Dice, DiceGroupRoll> {
	public get critMethodType(): CritMethodType { return this.core.critMethodType ?? CritMethodType.Unknown; }

	//#region Tests
	public getDiceByTestAlias(alias: TSpecialTestAliasType): OrNull<Dice> {
		return this.dice.find(_dice => _dice.hasTestAlias(alias)) ?? null;
	}
	//#endregion

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
				attack = undefined;

			// let's find attack
			}else if (dice.isD20 && (dice.hasAcTarget || !dice.hasTest)) {
			// }else if (dice.isD20 && dice.hasAcTarget) {
				attack = dice;

			}else {
				attack = undefined;

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
			gameType: GameType.PF2e,
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
		_dice.forEach(d => {
			if (d.hasSpecialTest && !d.isD20) {
				const dp = d.diceParts.find(dp => dp.hasSpecialTest)!.toJSON();
				dp.count = 1;
				dp.sides = 20;
			}
		});
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
		gameType: GameType.PF2e,
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
		manipulateStrikingDamage(diceGroupRoll);
		manipulateCriticalDamage(diceGroupRoll);
	}
}
export enum StrikingType { None = 0, Striking = 1, Greater = 2, Major = 3 }
function manipulateStrikingDamage(diceGroupRoll: DiceGroupRoll): void {
	const damageDice = diceGroupRoll.dice.attackDamageDice!.damage,
		baseDamage = damageDice?.baseDicePart;
	if (baseDamage && diceGroupRoll.hasStriking) {
		const strikingDiceCount = diceGroupRoll.strikingType + 1;
		if (baseDamage.count < strikingDiceCount) {
			const strikingDicePart = DicePart.create({ count: strikingDiceCount, sides: baseDamage.sides, description: baseDamage.description }),
				strikingDicePartRoll = strikingDicePart.roll().toJSON();

			const baseDamageIndex = damageDice.diceParts.indexOf(baseDamage);
			damageDice.diceParts.splice(baseDamageIndex, 1, strikingDicePart);

			const damageRollCores = diceGroupRoll.attackDamageRoll!.damage!.toJSON().rolls;
			const rollIndex = damageRollCores.findIndex(rollCore => baseDamage.is(rollCore.dice));
			damageRollCores.splice(rollIndex, 1, strikingDicePartRoll);
		}
	}
}
function critByTimesTwo(diceGroupRoll: DiceGroupRoll): void {
	const critDicePart = DicePart.create({ modifier: 2, sign: "*", description: "<i>(crit)</i>" });
	diceGroupRoll.dice.attackDamageDice?.damage!.diceParts.push(critDicePart);
	diceGroupRoll.attackDamageRoll?.damage!.toJSON().rolls.push(critDicePart.roll().toJSON());
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
	diceGroupRoll.dice.attackDamageDice?.damage!.diceParts.push(critDicePart);
	diceGroupRoll.attackDamageRoll?.damage!.toJSON().rolls.push(critDicePart.roll().toJSON());
}

function manipulateCriticalDamage(diceGroupRoll: DiceGroupRoll): void {
	if (diceGroupRoll.hasAttackCriticalSuccess) {
		const damageDice = diceGroupRoll.dice.attackDamageDice!.damage,
			damageRollCores = diceGroupRoll.attackDamageRoll!.damage.toJSON().rolls,
			hasFatal = diceGroupRoll.hasFatal,
			baseDamage = hasFatal ? damageDice.baseDicePart : null,
			fatalSides = hasFatal && baseDamage ? diceGroupRoll.fatalDie || increaseDieSize(baseDamage.sides) : null;
		if (hasFatal && baseDamage && fatalSides) {
			const fatalBaseDicePart = DicePart.create({ count: baseDamage.count, sides: fatalSides, description: cleanDescription(`${baseDamage.description} <i>(fatal)</i>`) }),
				baseDamageIndex = damageDice.diceParts.indexOf(baseDamage);
			damageDice.diceParts.splice(baseDamageIndex, 1, fatalBaseDicePart);
			damageRollCores.splice(baseDamageIndex, 1, fatalBaseDicePart.roll().toJSON());
		}

		const critMethodType = diceGroupRoll.dice.critMethodType;
		if (critMethodType === CritMethodType.AddMax) {
			critByAddingMax(diceGroupRoll);
		} else if (critMethodType === CritMethodType.RollTwice) {
			critByRollingTwice(diceGroupRoll);
		}else {
			critByTimesTwo(diceGroupRoll);
		}

		if (diceGroupRoll.hasDeadly) {
			const deadlyDieCount = strikingTypeToDeadlyDieCount(diceGroupRoll.strikingType),
				deadlyDicePart = DicePart.create({ count: deadlyDieCount, sides: diceGroupRoll.deadlyDie!, description: "<i>(deadly)</i>" });
			damageRollCores.push(deadlyDicePart.roll().toJSON());
		}

		if (hasFatal && fatalSides) {
			const fatalBonusDicePart = DicePart.create({ count: 1, sides: fatalSides, description: `<i>(fatal)</i>` });
			damageRollCores.push(fatalBonusDicePart.roll().toJSON());
		}
	}
}
function strikingTypeToDeadlyDieCount(strikingType: StrikingType): number {
	return strikingType === StrikingType.Major && 3 || strikingType === StrikingType.Greater && 2 || 1;
}

type DiceGroupRollCore = baseDiceGroupRollCore;
export class DiceGroupRoll extends baseDiceGroupRoll<DiceGroupRollCore, DiceGroup, DiceRoll> {
	// public getRollByTestAlias(alias: TSpecialTestAliasType): OrNull<DiceRoll> {
	// 	const _dice = this.dice.getDiceByTestAlias(alias);
	// 	return _dice ? DiceRoll.fromCore(this.core.rolls.find(rollCore => _dice.is(rollCore.dice))!) : null;
	// }
	public getSpecialTestRolls(): DiceRoll[] {
		return this.rolls.filter(roll => roll.dice.hasSpecialTest);
	}
	public get attackDamageRoll(): { attack:DiceRoll; damage:DiceRoll; } | undefined {
		const { attackDamageDice } = this.dice;
		if (attackDamageDice) {
			const { attack, damage } = attackDamageDice;
			return {
				attack: DiceRoll.fromCore(this.core.rolls.find(({dice}) => attack.is(dice))!),
				damage: DiceRoll.fromCore(this.core.rolls.find(({dice}) => damage.is(dice))!),
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
	public get hasDeadly(): boolean {
		const { attack, damage } = this.dice.attackDamageDice ?? { }
		return attack?.isDeadly ?? damage?.isDeadly ?? false;
	}
	public get hasFatal(): boolean {
		const { attack, damage } = this.dice.attackDamageDice ?? { }
		return attack?.isFatal ?? damage?.isFatal ?? false;
	}
	public get hasStriking(): boolean {
		const { attack, damage } = this.dice.attackDamageDice ?? { }
		return attack?.hasStriking ?? damage?.hasStriking ?? false;
	}

	public get deadlyDie(): OrNull<number> {
		const { attack, damage } = this.dice.attackDamageDice ?? { }
		return attack?.deadlyDie ?? damage?.deadlyDie ?? null;
	}
	public get fatalDie(): OrNull<number> {
		const { attack, damage } = this.dice.attackDamageDice ?? { }
		return attack?.fatalDie ?? damage?.fatalDie ?? null;
	}
	public get strikingType(): StrikingType {
		const { attack, damage } = this.dice.attackDamageDice ?? { }
		return attack?.strikingType ?? damage?.strikingType ?? StrikingType.None;
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
