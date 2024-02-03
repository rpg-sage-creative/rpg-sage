import { DiceDropKeepType, DiceTest, DiceTestData, DiceTestType, DieRollGrade, decreaseGrade, gradeRoll, increaseGrade, isGradeSuccess, parseDiceTestTargetValue, parseDiceTestType } from "@rsc-utils/dice-utils";
import { tokenize, type TokenData, type TokenParsers } from "@rsc-utils/string-utils";
import { isDefined, type OrNull, type OrUndefined } from "@rsc-utils/type-utils";
import { randomUuid } from "@rsc-utils/uuid-utils";
import { GameType } from "../../../sage-common";
import {
	CritMethodType,
	DiceOutputType,
	DiceSecretMethodType,
	TDiceLiteral,
	TSign,
	cleanDescription
} from "../../common";
import {
	TReduceSignToDropKeep,
	Dice as baseDice, DiceGroup as baseDiceGroup,
	DiceGroupRoll as baseDiceGroupRoll, DicePart as baseDicePart,
	DicePartRoll as baseDicePartRoll, DiceRoll as baseDiceRoll, getParsers as baseGetParsers, reduceTokenToDicePartCore as baseReduceTokenToDicePartCore
} from "../base";
import type {
	DiceCore as baseDiceCore, DiceGroupCore as baseDiceGroupCore,
	DiceGroupRollCore as baseDiceGroupRollCore, DicePartCore as baseDicePartCore,
	DicePartRollCore as baseDicePartRollCore, DiceRollCore as baseDiceRollCore, TDicePartCoreArgs as baseTDicePartCoreArgs
} from "../base/types";

//#region Tokenizer
function getParsers(): TokenParsers {
	const parsers = baseGetParsers();
	// used to make sure we tokenize deadly as a description and not another die to roll
	parsers["special"] = /(deadly|fatal)\s*d(\d+)/i;
	parsers["target"] = /(vs\s*ac|vs\s*dc|ac|dc|vs)\s*(\d+|\|\|\d+\|\|)/i;

	// vs type
	parsers["concealed"] = /(vs\s*conceal(?:ed|ment)?)/i;
	parsers["deafened"] = /(vs\s*deaf(?:ened)?)/i;
	parsers["hidden"] = /(vs\s*hidden)/i;
	parsers["stupefied"] = /(vs\s*stup[ie]fied)\s*(\d+)/i;
	parsers["undetected"] = /(vs\s*undetected)/i;

	// vs or just type
	// parsers["concealed"] = /((?:vs\s*)?conceal(?:ed|ment)?)/i;
	// parsers["deafened"] = /((?:vs\s*)?deaf(?:ened)?)/i;
	// parsers["hidden"] = /((?:vs\s*)?hidden)/i;
	// parsers["stupefied"] = /(vs\s*stup(?:i|e)fied|stup(?:i|e)fied)\s*(\d+)/i;
	// parsers["undetected"] = /((?:vs\s*)?undetected)/i;

	return parsers;
}
const FORTUNE = "Fortune";
const MISFORTUNE = "Misfortune";
function reduceTokenToDicePartCore<T extends DicePartCore>(core: T, token: TokenData, index: number, tokens: TokenData[]): T {
	if (token.key === "target") {
		core.target = parseTargetData(token);
		return core;
	}
	const reduceSignToDropKeepData: TReduceSignToDropKeep[] = [];
	if (token.key === "dice") {
		reduceSignToDropKeepData.push(
			{ sign:"+" as TSign, type:DiceDropKeepType.KeepHighest, value:1, alias:FORTUNE, test:_core => _core.count === 2 && _core.sides === 20 && _core.sign === "+" },
			{ sign:"-" as TSign, type:DiceDropKeepType.KeepLowest, value:1, alias:MISFORTUNE, test:_core => _core.count === 2 && _core.sides === 20 && _core.sign === "-" }
		);
	}
	return baseReduceTokenToDicePartCore(core, token, index, tokens, reduceSignToDropKeepData);
}
//#endregion

//#region Targets/Tests
type TSpecialTestAliasType = "concealed" | "deafened" | "hidden" | "stupefied" | "undetected";
const SpecialTestAliases: TSpecialTestAliasType[] = ["deafened", "stupefied", "concealed", "hidden", "undetected"];
export enum TargetType { None = 0, AC = 1, DC = 2, VS = 3, Concealed = 4, Deafened = 5, Hidden = 6, Stupefied = 7, Undetected = 8 }
export type TTargetData = { type:TargetType; value:number; hidden:boolean; raw:string; };
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
		const type = parseTargetType(token.matches[0]);
		let { value, hidden } = parseDiceTestTargetValue(token.matches[1]);
		value = parseTargetValue(type, value);
		return { type, value, hidden, raw:token.token };
	}
	return undefined;
}
function targetDataToTestData(targetData: TTargetData | DiceTestData): OrUndefined<DiceTestData> {
	if (targetData) {
		const alias = (<DiceTestData>targetData).alias;
		if (alias) {
			const testType = parseDiceTestType(alias);
			if (testType) {
				return DiceTest.createData(testType, targetData.value, targetData.hidden);
			}
		}
		return DiceTest.createData(DiceTestType.GreaterThanOrEqual, targetData.value, targetData.hidden, TargetType[targetData.type].toLowerCase());
	}
	return undefined;
}
//#endregion

//#region CONST

export const DEADLY_REGEX = /deadly\s*d(\d+)/i;
export const FATAL_REGEX = /fatal\s*d(\d+)/i;

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

function gradeResults(roll: DiceRoll): DieRollGrade {
	const test = roll.dice.test;
	if (test?.alias?.match(/ac|dc|vs/i)) {
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
enum TestDiceResult { Unknown = 0, UndetectedFailure = 1, Failure = 2, Success = 3, UndetectedSuccess = 4 }

// function isBoolean(value: Optional<boolean>): value is boolean {
// 	return value === true || value === false;
// }

/** success = null if no alias tests, otherwise pass/fail; undetected = null if no "undetected" alias test, otherwise pass/fail */
function toTestDiceResult(success: OrNull<boolean>, undetected: OrNull<boolean>): TestDiceResult {
	if (success !== null) {
		if (undetected !== null) {
			return success ? TestDiceResult.UndetectedSuccess : TestDiceResult.UndetectedFailure;
		}
		return success ? TestDiceResult.Success : TestDiceResult.Failure;
	}
	return TestDiceResult.Unknown;
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

/** null if no alias test, otherwise pass/fail */
function _testDiceGroupRollToString(rollOutputs: string[], diceGroupRoll: DiceGroupRoll, testAlias: TSpecialTestAliasType, attackGrade: DieRollGrade): OrNull<boolean> {
	const diceRoll = diceGroupRoll.getRollByTestAlias(testAlias);
	if (!diceRoll) {
		return null;
	}
	const grade = diceRoll.grade,
		success = [DieRollGrade.CriticalSuccess, DieRollGrade.Success].includes(grade),
		failure = [DieRollGrade.CriticalFailure, DieRollGrade.Failure].includes(grade),
		emojiGrade = _gradeEmoji(success, failure, testAlias === "undetected" ? attackGrade : DieRollGrade.Unknown),
		total = testAlias === "undetected" && (failure || !isGradeSuccess(attackGrade)) ? `||${diceRoll.total}||` : diceRoll.total;
	rollOutputs.push(`${emojiGrade} ${total} (${testAlias})`);
	// TOOD: revisit this? rollOutputs.push(`[${testAlias}${emojiGrade}] ${total} (${testAlias})`);

	return !grade ? null : success;
}
function testDiceGroupRollToString(rollOutputs: string[], diceGroupRoll: DiceGroupRoll, attackGrade: DieRollGrade): TestDiceResult {
	let successful: OrNull<boolean> = null,
		undetected: OrNull<boolean> = null;
	for (const testAlias of SpecialTestAliases) {
		const boolResult = _testDiceGroupRollToString(rollOutputs, diceGroupRoll, testAlias, attackGrade);
		if (boolResult !== null) {
			successful = boolResult;
			if (testAlias === "undetected") {
				undetected = boolResult;
			}
			if (successful === false) {
				break;
			}
		}
	}
	return toTestDiceResult(successful, undetected);
}

/**
 * Checks to see if an attack's result should be hidden.
 * We only do so if the attack is against an undetected foe and we missed either the attack or the flat check.
 */
function _hideAttackRoll(testDiceResult: TestDiceResult, attackGrade: DieRollGrade): boolean {
	const undetected = [TestDiceResult.UndetectedSuccess, TestDiceResult.UndetectedFailure].includes(testDiceResult),
		undetectedSuccess = testDiceResult === TestDiceResult.UndetectedSuccess,
		attackSuccess = isGradeSuccess(attackGrade);
	return undetected && (!undetectedSuccess || !attackSuccess);
}

/**
 * Checks to see if an attack's damage should be hidden.
 * If the attack failed or we failed a flat check against hidden we don't show the damage.
 */
function _hideDamageRolls(testDiceResult: TestDiceResult, attackGrade: DieRollGrade): boolean {
	const attackSuccess = isGradeSuccess(attackGrade);
	return	!attackSuccess || _hideAttackRoll(testDiceResult, attackGrade);
}

function diceGroupRollToString(diceGroupRoll: DiceGroupRoll, outputType: DiceOutputType, joiner = "\n"): string {
	const rollOutputs: string[] = [],
		attackRoll = diceGroupRoll.attackRoll,
		attackGrade = attackRoll?.grade ?? DieRollGrade.Unknown,
		testDiceResult = testDiceGroupRollToString(rollOutputs, diceGroupRoll, attackGrade);
	if (testDiceResult !== TestDiceResult.Failure) {
		if (attackRoll) {
			const hideAttackRoll = _hideAttackRoll(testDiceResult, attackGrade);
			rollOutputs.push(attackRoll.toString(outputType, hideAttackRoll));
		}
		const damageRoll = diceGroupRoll.damageRoll;
		const hideDamageRolls = _hideDamageRolls(testDiceResult, attackGrade);
		if (attackRoll && damageRoll && (!attackGrade || !hideDamageRolls)) {
			const emoji = attackGrade ? `[damage] ` : ``;
			rollOutputs.push(`${emoji}${damageRoll.toString(outputType)}`);
		}
		diceGroupRoll.otherRolls.forEach(diceRoll => rollOutputs.push(diceRoll.toString(outputType)));
	}
	return rollOutputs.join(joiner);
}
//#endregion

//#region increaseDieSize
function increaseDieSize(sides: number): number {
	const damageDieSides = [4, 6, 8, 10, 12];
	const index = damageDieSides.indexOf(sides);
	return damageDieSides[index + 1] || 12;
}
//#endregion

//#region mapFirst
function mapFirst<T, U>(array: T[], mapper: (o: T, i: number, a: T[]) => U): OrUndefined<U> {
	for (let i = 0; i < array.length; i++) {
		const result = mapper(array[i], i, array);
		if (result !== undefined && result !== null) {
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
	testOrTarget?: DiceTestData | TTargetData;
};
export class DicePart extends baseDicePart<DicePartCore, DicePartRoll> {
	//#region flags
	public get hasFortune(): boolean {
		return this.dropKeep.alias === FORTUNE;
	}
	public get hasMisfortune(): boolean {
		return this.dropKeep.alias === MISFORTUNE;
	}
	//#endregion

	//#region static
	public static create({ count, sides, dropKeep, noSort, modifier, sign, description, testOrTarget, fixedRolls }: TDicePartCoreArgs = {}): DicePart {
		return new DicePart({
			objectType: "DicePart",
			gameType: GameType.PF2e,
			id: randomUuid(),

			count: count ?? 0,
			description: cleanDescription(description),
			dropKeep: dropKeep,
			fixedRolls,
			modifier: modifier ?? 0,
			noSort: noSort === true,
			sides: sides ?? 0,
			sign: sign,
			test: targetDataToTestData(testOrTarget as TTargetData) ?? testOrTarget as DiceTestData,
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
	public get isDeadly(): boolean {
		return this.deadlyDie !== null;
	}
	public get isFatal(): boolean {
		return this.fatalDie !== null;
	}
	public get isGreaterStriking(): boolean {
		return this.diceParts.find(dicePart => dicePart.description.match(/greater\s*striking/i) !== null) !== undefined;
	}
	public get isMajorStriking(): boolean {
		return this.diceParts.find(dicePart => dicePart.description.match(/major\s*striking/i) !== null) !== undefined;
	}
	public get isStriking(): boolean {
		return this.diceParts.find(dicePart => dicePart.description.match(/striking/i) && !dicePart.description.match(/(greater|major)\s*striking/i)) !== undefined;
	}
	public get hasStriking(): boolean {
		return this.diceParts.find(dicePart => dicePart.description.match(/striking/i)) !== undefined;
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
			id: randomUuid(),
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
			id: randomUuid(),
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

	//#region Attack
	public get hasAttackDice(): boolean {
		return this.attackDice !== null;
	}
	public get attackDice(): OrNull<Dice> {
		const testDice = SpecialTestAliases.map(testAlias => this.getDiceByTestAlias(testAlias));
		const attackDice = this.dice.find(_dice => _dice.isD20 && (!_dice.test || !testDice.includes(_dice)));
		if (attackDice) {
			testDice.push(attackDice);
			const damageDice = this.dice.find(_dice => !_dice.isD20 && !_dice.test && !testDice.includes(_dice));
			if (damageDice) {
				return attackDice;
			}
		}
		return null;
	}
	//#endregion

	//#region Damage
	public get hasDamageDice(): boolean {
		return this.damageDice !== null;
	}
	public get damageDice(): OrNull<Dice> {
		const attackDice = this.attackDice;
		if (attackDice) {
			const testDice = SpecialTestAliases.map(testAlias => this.getDiceByTestAlias(testAlias));
			testDice.push(attackDice);
			return this.dice.find(_dice => !_dice.isD20 && !_dice.test && !testDice.includes(_dice)) ?? null;
		}
		return null;
	}
	//#endregion

	//#region Others
	public get hasOtherDice(): boolean {
		return this.otherDice.length > 0;
	}
	public get otherDice(): Dice[] {
		const nonOtherDice = SpecialTestAliases
			.map(testAlias => this.getDiceByTestAlias(testAlias))
			.concat([this.attackDice, this.damageDice])
			.filter(isDefined);
		return this.dice.filter(_dice => !nonOtherDice.includes(_dice));
	}
	//#endregion

	public toString(outputType?: DiceOutputType): string {
		const sortedDice = SpecialTestAliases.map(testAlias => this.getDiceByTestAlias(testAlias))
			.concat([this.attackDice, this.damageDice])
			.concat(this.otherDice)
			.filter(isDefined);
		return `[${sortedDice.map(_dice => _dice.toString(outputType)).join("; ")}]`;
	}

	//#region static
	public static create(_dice: Dice[], diceOutputType?: DiceOutputType, diceSecretMethodType?: DiceSecretMethodType, critMethodType = CritMethodType.Unknown): DiceGroup {
		return new DiceGroup({
			objectType: "DiceGroup",
			gameType: GameType.PF2e,
			id: randomUuid(),
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
		gameType: GameType.PF2e,
		id: randomUuid(),
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
	const damageDice = diceGroupRoll.dice.damageDice,
		baseDamage = damageDice?.baseDicePart;
	if (baseDamage && diceGroupRoll.hasStriking) {
		const strikingDiceCount = diceGroupRoll.strikingType + 1;
		if (baseDamage.count < strikingDiceCount) {
			const strikingDicePart = DicePart.create({ count: strikingDiceCount, sides: baseDamage.sides, description: baseDamage.description }),
				strikingDicePartRoll = strikingDicePart.roll().toJSON();

			const baseDamageIndex = damageDice.diceParts.indexOf(baseDamage);
			damageDice.diceParts.splice(baseDamageIndex, 1, strikingDicePart);

			const damageRollCores = diceGroupRoll.damageRoll!.toJSON().rolls;
			const rollIndex = damageRollCores.findIndex(rollCore => baseDamage.is(rollCore.dice));
			damageRollCores.splice(rollIndex, 1, strikingDicePartRoll);
		}
	}
}
function critByTimesTwo(diceGroupRoll: DiceGroupRoll): void {
	const critDicePart = DicePart.create({ modifier: 2, sign: "*", description: "<i>(crit)</i>" });
	diceGroupRoll.dice.damageDice!.diceParts.push(critDicePart);
	diceGroupRoll.damageRoll!.toJSON().rolls.push(critDicePart.roll().toJSON());
}
function critByRollingTwice(diceGroupRoll: DiceGroupRoll): void {
	const damageDice = diceGroupRoll.dice.damageDice!;
	const damageRoll = diceGroupRoll.damageRoll!;
	damageDice.diceParts.forEach((dicePart, index) => {
		if (dicePart.hasDie) {
			damageRoll.toJSON().rolls[index].rolls.push(...dicePart.roll().rolls);
			dicePart.toJSON().count *= 2;
		}else if (dicePart.modifier) {
			dicePart.toJSON().modifier *= 2;
		}
	});

	const critDicePart = DicePart.create({ description: "<i>(crit; roll 2x)</i>" });
	damageDice.diceParts.push(critDicePart);
	damageRoll.toJSON().rolls.push(critDicePart.roll().toJSON());
}
function critByAddingMax(diceGroupRoll: DiceGroupRoll): void {
	const critDicePart = DicePart.create({ modifier: diceGroupRoll.damageRoll!.dice.max, sign: "+", description: "<i>(crit; add max)</i>" });
	diceGroupRoll.dice.damageDice!.diceParts.push(critDicePart);
	diceGroupRoll.damageRoll!.toJSON().rolls.push(critDicePart.roll().toJSON());
}

function manipulateCriticalDamage(diceGroupRoll: DiceGroupRoll): void {
	if (diceGroupRoll.hasAttackCriticalSuccess) {
		const damageDice = diceGroupRoll.dice.damageDice!,
			damageRollCores = diceGroupRoll.damageRoll!.toJSON().rolls,
			hasFatal = diceGroupRoll.hasFatal,
			baseDamage = hasFatal ? damageDice.baseDicePart : null,
			fatalSides = hasFatal && baseDamage ? diceGroupRoll.fatalDie ?? increaseDieSize(baseDamage.sides) : null;
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
	public getRollByTestAlias(alias: TSpecialTestAliasType): OrNull<DiceRoll> {
		const _dice = this.dice.getDiceByTestAlias(alias);
		return _dice ? DiceRoll.fromCore(this.core.rolls.find(rollCore => _dice.is(rollCore.dice))!) : null;
	}
	public get attackRoll(): OrNull<DiceRoll> {
		const attackDice = this.dice.attackDice;
		return attackDice ? DiceRoll.fromCore(this.core.rolls.find(rollCore => attackDice.is(rollCore.dice))!) : null;
	}
	public get damageRoll(): OrNull<DiceRoll> {
		const damageDice = this.dice.damageDice;
		return damageDice ? DiceRoll.fromCore(this.core.rolls.find(rollCore => damageDice.is(rollCore.dice))!) : null;
	}
	public get otherRolls(): DiceRoll[] {
		const nonOtherRolls = SpecialTestAliases
			.map(testAlias => this.getRollByTestAlias(testAlias))
			.concat([this.attackRoll, this.damageRoll])
			.filter(isDefined);
		return this.core.rolls.filter(rollCore => !nonOtherRolls.find(roll => roll.is(rollCore))).map(DiceRoll.fromCore);
	}

	//#region convenience / flags
	public get hasAttackAndDamage(): boolean {
		return this.dice.hasAttackDice && this.dice.hasDamageDice;
	}
	public get hasAttackCriticalSuccess(): boolean {
		return this.attackRoll?.grade === DieRollGrade.CriticalSuccess;
	}
	public get hasDeadly(): boolean {
		return this.dice.attackDice?.isDeadly
			?? this.dice.damageDice?.isDeadly
			?? false;
	}
	public get hasFatal(): boolean {
		return this.dice.attackDice?.isFatal
			?? this.dice.damageDice?.isFatal
			?? false;
	}
	public get hasStriking(): boolean {
		return this.dice.attackDice?.hasStriking
			?? this.dice.damageDice?.hasStriking
			?? false;
	}

	public get deadlyDie(): OrNull<number> {
		return this.dice.attackDice?.deadlyDie
			?? this.dice.damageDice?.deadlyDie
			?? null;
	}
	public get fatalDie(): OrNull<number> {
		return this.dice.attackDice?.fatalDie
			?? this.dice.damageDice?.fatalDie
			?? null;
	}
	public get strikingType(): StrikingType {
		return this.dice.attackDice?.strikingType
			?? this.dice.damageDice?.strikingType
			?? StrikingType.None;
	}
	//#endregion

	public toString(outputType?: DiceOutputType, inline = false): string {
		let _outputType = this.dice.diceOutputType ?? outputType ?? DiceOutputType.M;
		if (inline) {
			_outputType = <DiceOutputType>Math.min(_outputType, DiceOutputType.M);
		}
		const joiner = _outputType < DiceOutputType.L ? "; " : "\n";
		return diceGroupRollToString(this, _outputType, joiner);
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
