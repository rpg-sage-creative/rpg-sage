import { Dice, DiceExplode, DiceGroup, DicePart, DiceTest, DiceTestType, DieRollGrade, UNICODE_LEFT_ARROW, cleanDicePartDescription, gradeToEmoji, parseDiceTestTargetValue, type DiceBase, type DiceCore, type DiceGroupCore, type DiceGroupCoreArgs, type DicePartCore, type DicePartCoreArgs, type DiceTestData, type TDice, type TDiceGroup, type TDicePart } from "@rsc-utils/dice-utils";
import { randomSnowflake } from "@rsc-utils/snowflake-utils";
import { cleanWhitespace, type TokenData, type TokenParsers } from "@rsc-utils/string-utils";
import { GameType } from "../../../sage-common";
import { DiceSecretMethodType } from "../../common";

/*
default target ("VS") = 8

roll Xd12

for each die:
     1: -1 success
  < VS:  0 successes
   VS+: +1 success
    12: +1 success and crit die

for each crit die:
  < VS: +1 success
   VS+: +2 successes and crit die

final success/failure
   1+: success
    0: failure
  < 0: critical failure
*/

//#region Tokenizer

function getTokenParsers(): TokenParsers {
	return {
		dice: /\s*(\d+)?\s*d\s*(12)/i,
		target: /(vs)\s*(\d+|\|\|\d+\|\|)/i
	};
}

function reduceTokenToDicePartCore<T extends DicePartCore>(core: T, token: TokenData): T {
	if (token.key === "dice") {
		core.count = +token.matches[0];
		core.sides = 12;
	}else if (token.key === "target") {
		const { value, hidden } = parseDiceTestTargetValue(token.matches[1]);
		core.target = { type:TargetType.VS, value, hidden };
	}else {
		core.description = (core.description ?? "") + token.token;
	}
	return core;
}

//#endregion

//#region Targets/Tests

enum TargetType { None = 0, VS = 1 }

function targetDataToTestData(targetData?: DiceTestData<TargetType>): DiceTestData | undefined {
	if (targetData) {
		return DiceTest.createData(DiceTestType.GreaterThanOrEqual, targetData.value, targetData.hidden, "vs");
	}
	return undefined;
}

//#endregion

//#region Grades

function gradeDie(value: number, vs: number): DieRollGrade {
	if (value === 12) {
		return DieRollGrade.CriticalSuccess;
	}else if (value >= vs) {
		return DieRollGrade.Success;
	}else if (value > 1) {
		return DieRollGrade.Failure;
	}else if (value === 1) {
		return DieRollGrade.CriticalFailure;
	}else {
		return DieRollGrade.Unknown;
	}
}

function gradeRoll(baseValues: number[], explodedValues: number[], vs: number): [DieRollGrade, number[]] {
	const values = [
		/** total successes */
		0,
		/** CriticalFailures */
		0,
		/** Failures */
		0,
		/** Successes */
		0,
		/** CriticalSuccesses */
		0,
		/** total exploded successes */
		0
	];

	// base values can be success or failure
	baseValues.forEach(value => {
		const grade = gradeDie(value, vs);

		// increment count for grade
		values[grade]++;

		// update total successes
		switch(grade) {
			case DieRollGrade.CriticalSuccess:
			case DieRollGrade.Success:
				values[0] += 1;
				break;
			case DieRollGrade.CriticalFailure:
				values[0] -= 1;
				break;
		}
	});

	// exploded values are only crit success or success
	explodedValues.forEach(value => {
		const grade = gradeDie(value, vs);
		if (grade === DieRollGrade.CriticalSuccess) {
			// increment count for grade
			values[DieRollGrade.CriticalSuccess]++;
			// update total exploded successes
			values[5] += 2;
		}else {
			// increment count for grade
			values[DieRollGrade.Success]++;
			// update total exploded successes
			values[5] += 1;
		}
	});

	const totalSuccesses = values[0] + values[5];
	let grade: DieRollGrade;
	if (totalSuccesses === 0) {
		grade = DieRollGrade.Failure;
	}else if (totalSuccesses < 0) {
		grade = DieRollGrade.CriticalFailure;
	}else {
		grade = DieRollGrade.Success;
	}

	return [grade, values];
}

//#endregion

export class CnCDicePart extends DicePart<DicePartCore<TargetType>, TargetType, GameType> {

	public static create<DicePartType extends TDicePart>({ count, description, target }: DicePartCoreArgs = {}): DicePartType {
		return new this({
			objectType: "DicePart",
			gameType: this.GameType,
			id: randomSnowflake(),

			children: undefined!,
			count: count ?? 1,
			description: cleanDicePartDescription(description),
			fixedRolls: undefined!,
			manipulation: [{ explode:new DiceExplode({ alias:"x", type:DiceTestType.Equal, value:12 }) }],
			modifier: 0,
			sides: 12,
			sign: undefined!,
			test: this.targetDataToTestData(target),
			target
		}) as DicePartType;
	}

	public static readonly reduceTokenToCore = reduceTokenToDicePartCore;

	public static readonly targetDataToTestData = targetDataToTestData;

	public static readonly GameType = GameType.CnC;

}

export class CnCDice extends Dice<DiceCore, CnCDicePart, GameType> {
	public toRollString(): string {
		const sortedRollData = this.primary?.sortedRollData;
		const baseCount = sortedRollData?.initialCount ?? 0;
		const baseValues = sortedRollData?.byIndex.slice(0, baseCount).map(r => r.value) ?? [];
		const critValues = sortedRollData?.byIndex.slice(baseCount).map(r => r.value) ?? [];
		const vs = this.test?.value ?? 8;
		const vsOutput = vs !== 8 ? ` vs ${vs} ` : ``;
		const [grade, gradeValues] = gradeRoll(baseValues, critValues, vs);
		const gradeOutput = gradeToEmoji(grade);
		const baseOutput = ` [${baseValues.join(",")}]${baseValues.length}d12 ${vsOutput} (**${gradeValues[0]}**)`;
		const critOutput = critValues.length ? ` + [${critValues.join(",")}]${critValues.length}d12 ${vsOutput} (**${gradeValues[5]}**)` : ``;
		const totalSuccesses = critValues.length ? ` -> **${gradeValues[0] + gradeValues[5]}**` : ``;
		const desc = this.children.find(dp => dp.hasDescription)?.description;
		const descOutput = desc ? "`" + desc + "`" : "";
		return cleanWhitespace(`${gradeOutput} ${descOutput} ${UNICODE_LEFT_ARROW} ${baseOutput} ${critOutput} ${totalSuccesses}`);
	}

	public static readonly Child = CnCDicePart as typeof DiceBase;

	public static readonly GameType = GameType.CnC;

	// We shouldn't be using this, but just in case let's return unknown.
	public static readonly gradeRoll = () => 0;

	public static readonly gradeToEmoji = gradeToEmoji;
}

export class CnCDiceGroup extends DiceGroup<DiceGroupCore, CnCDice, GameType> {

	public static create<DiceGroupType extends TDiceGroup, DiceType extends TDice>(dice: DiceType[], args?: DiceGroupCoreArgs): DiceGroupType {
		return new this({
			objectType: "DiceGroup",
			gameType: this.GameType,
			id: randomSnowflake(),

			children: dice.map(d => d.toJSON()),
			criticalMethodType: undefined!,
			outputType: args?.outputType,
			secretMethodType: DiceSecretMethodType.Ignore,
		}) as DiceGroupType;
	}

	public static readonly getTokenParsers = getTokenParsers;

	public static readonly Child = CnCDice as typeof DiceBase;

	public static readonly GameType = GameType.CnC;

}