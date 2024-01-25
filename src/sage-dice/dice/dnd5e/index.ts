import { tokenize, type TokenData, type TokenParsers } from "@rsc-utils/string-utils";
import { isDefined, type OrNull, type OrUndefined } from "@rsc-utils/type-utils";
import { randomUuid } from "@rsc-utils/uuid-utils";
import { GameType } from "../../../sage-common";
import {
	CritMethodType, DiceOutputType,
	DiceSecretMethodType,
	DieRollGrade,
	DropKeepType,
	TDiceLiteral,
	TSign,
	TTestData,
	TestType,
	cleanDescription,
	createValueTestData,
	gradeRoll, isGradeSuccess,
	parseTestTargetValue,
	parseTestType
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
	return {
		...baseGetParsers(),
		target: /(vs\s*ac|vs\s*dc|ac|dc|vs)\s*(\d+|\|\|\d+\|\|)/i
	};
}
const ADVANTAGE = "Advantage";
const DISADVANTAGE = "Disadvantage";
function reduceTokenToDicePartCore<T extends DicePartCore>(core: T, token: TokenData, index: number, tokens: TokenData[]): T {
	if (token.key === "target") {
		core.target = parseTargetData(token);
		return core;
	}
	const reduceSignToDropKeepData: TReduceSignToDropKeep[] = [];
	if (token.key === "dice") {
		reduceSignToDropKeepData.push(
			{ sign:"+" as TSign, type:DropKeepType.KeepHighest, value:1, alias:ADVANTAGE, test:_core => _core.count === 2 && _core.sides === 20 && _core.sign === "+" },
			{ sign:"-" as TSign, type:DropKeepType.KeepLowest, value:1, alias:DISADVANTAGE, test:_core => _core.count === 2 && _core.sides === 20 && _core.sign === "-" }
		);
	}
	return baseReduceTokenToDicePartCore(core, token, index, tokens, reduceSignToDropKeepData);
}
//#endregion

//#region Targets/Tests
export enum TargetType { None = 0, AC = 1, DC = 2, VS = 3 }
export type TTargetData = { type:TargetType; value:number; hidden:boolean; raw:string; };
function parseTargetType(targetType: string): TargetType {
	const targetTypeLower = targetType.toLowerCase();
	if (targetTypeLower.endsWith("ac")) {
		return TargetType.AC;
	}else if (targetTypeLower.endsWith("dc")) {
		return TargetType.DC;
	}else if (targetTypeLower.endsWith("vs")) {
		return TargetType.VS;
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

function gradeResults(roll: DiceRoll): DieRollGrade {
	const test = roll.dice.test;
	if (test?.alias?.match(/ac|dc|vs/i)) {
		if (roll.isMax) {
			return DieRollGrade.CriticalSuccess;
		}else if (roll.isMin) {
			return DieRollGrade.CriticalFailure;
		}
		return roll.total >= test.value ? DieRollGrade.Success : DieRollGrade.Failure;
	}
	return gradeRoll(roll);
}

//#endregion

//#region diceGroupRollToString

function diceGroupRollToString(diceGroupRoll: DiceGroupRoll, outputType: DiceOutputType, joiner = "\n"): string {
	const rollOutputs: string[] = [],
		attackRoll = diceGroupRoll.attackRoll;
	if (attackRoll) {
		rollOutputs.push(attackRoll.toString(outputType));

		const attackGrade = attackRoll?.grade ?? DieRollGrade.Unknown;
		const showRolls = !attackGrade || isGradeSuccess(attackGrade);
		if (showRolls) {
			const damageRoll = diceGroupRoll.damageRoll;
			if (damageRoll) {
				const dmgEmoji = attackGrade ? `[damage] ` : ``;
				rollOutputs.push(`${dmgEmoji}${damageRoll.toString(outputType)}`);
			}

			diceGroupRoll.otherRolls.forEach(diceRoll => rollOutputs.push(diceRoll.toString(outputType)));
		}
	}else {
		diceGroupRoll.rolls.forEach(diceRoll => rollOutputs.push(diceRoll.toString(outputType)));
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
export class DicePart extends baseDicePart<DicePartCore, DicePartRoll> {
	//#region flags
	public get hasAdvantage(): boolean {
		return this.dropKeep?.alias === ADVANTAGE;
	}
	public get hasDisadvantage(): boolean {
		return this.dropKeep?.alias === DISADVANTAGE;
	}
	//#endregion

	//#region static
	public static create({ count, sides, dropKeep, noSort, modifier, sign, description, testOrTarget, fixedRolls }: TDicePartCoreArgs = {}): DicePart {
		return new DicePart({
			objectType: "DicePart",
			gameType: GameType.DnD5e,
			id: randomUuid(),

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
		return new DicePartRoll(this._createCore(dicePart, GameType.DnD5e));
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

	//#region static
	public static create(diceParts: DicePart[]): Dice {
		return new Dice({
			objectType: "Dice",
			gameType: GameType.DnD5e,
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
	//#region calculated
	public get grade(): DieRollGrade { return gradeResults(this); }
	//#endregion

	//#region static
	public static create(_dice: Dice): DiceRoll {
		return new DiceRoll({
			objectType: "DiceRoll",
			gameType: GameType.DnD5e,
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

	//#region Attack
	public get hasAttackDice(): boolean {
		return this.attackDice !== null;
	}
	public get attackDice(): OrNull<Dice> {
		const testDice: Dice[] = [];
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
			const testDice: Dice[] = [attackDice];
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
		const nonOtherDice = [this.attackDice, this.damageDice]
			.filter(isDefined);
		return this.dice.filter(_dice => !nonOtherDice.includes(_dice));
	}
	//#endregion

	public toString(outputType?: DiceOutputType): string {
		const sortedDice = [this.attackDice, this.damageDice]
			.concat(this.otherDice)
			.filter(isDefined);
		return `[${sortedDice.map(_dice => _dice.toString(outputType)).join("; ")}]`;
	}

	//#region static
	public static create(_dice: Dice[], diceOutputType?: DiceOutputType, diceSecretMethodType?: DiceSecretMethodType, critMethodType = CritMethodType.Unknown): DiceGroup {
		return new DiceGroup({
			objectType: "DiceGroup",
			gameType: GameType.DnD5e,
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
		gameType: GameType.DnD5e,
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
		manipulateCriticalDamage(diceGroupRoll);
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
	public get attackRoll(): OrNull<DiceRoll> {
		const attackDice = this.dice.attackDice;
		return attackDice ? DiceRoll.fromCore(this.core.rolls.find(rollCore => attackDice.is(rollCore.dice))!) : null;
	}
	public get damageRoll(): OrNull<DiceRoll> {
		const damageDice = this.dice.damageDice;
		return damageDice ? DiceRoll.fromCore(this.core.rolls.find(rollCore => damageDice.is(rollCore.dice))!) : null;
	}
	public get otherRolls(): DiceRoll[] {
		const nonOtherRolls = [this.attackRoll, this.damageRoll]
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
