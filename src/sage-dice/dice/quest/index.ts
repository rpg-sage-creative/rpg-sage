import { Dice, DiceGroup, DicePart, DiceTest, DiceTestType, DieRollGrade, cleanDicePartDescription, parseDiceTestTargetValue, type DiceBase, type DiceCore, type DiceGroupCore, type DiceGroupCoreArgs, type DicePartCore, type DicePartCoreArgs, type DiceTestData, type TDice, type TDiceGroup, type TDicePart } from "@rsc-utils/dice-utils";
import { randomSnowflake } from "@rsc-utils/snowflake-utils";
import { type TokenData, type TokenParsers } from "@rsc-utils/string-utils";
import { GameType } from "../../../sage-common";
import { DiceSecretMethodType } from "../../common";

//#region Tokenizer

function getTokenParsers(): TokenParsers {
	return {
		dice: /\s*(1)?\s*d\s*(20)/i,
		target: /(vs)\s*(\d+|\|\|\d+\|\|)/i
	};
}

function reduceTokenToDicePartCore<T extends DicePartCore>(core: T, token: TokenData): T {
	if (token.key === "dice") {
		core.count = 1;
		core.sides = 20;
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
		return DiceTest.createData(DiceTestType.GreaterThan, targetData.value, targetData.hidden, "vs");
	}
	return undefined;
}

//#endregion

//#region Grades

function gradeRoll(dice: QuestDice): DieRollGrade {
	const test = dice.test;
	if (!test.isEmpty) {
		return dice.total > test.value ? DieRollGrade.Success : DieRollGrade.Failure;
	}
	if (dice.total === 20) {
		return DieRollGrade.CriticalSuccess;
	}else if (dice.total > 10) {
		return DieRollGrade.Success;
	}else if (dice.total > 5) {
		return DieRollGrade.Failure;
	}else if (dice.total > 1) {
		return DieRollGrade.CriticalFailure;
	}else {
		return DieRollGrade.Unknown;
	}
}

function gradeToEmoji(grade: DieRollGrade, vs?: boolean): string | undefined {
	if (vs) {
		return Dice.gradeToEmoji(grade) ?? `:question:`;
	}
	return Dice.gradeToEmoji(grade) ?? `:bangbang:`;
}

//#endregion

export class QuestDicePart extends DicePart<DicePartCore<TargetType>, TargetType, GameType> {

	public static create<DicePartType extends TDicePart>({ description, target }: DicePartCoreArgs = {}): DicePartType {
		return new this({
			objectType: "DicePart",
			gameType: this.GameType,
			id: randomSnowflake(),

			children: undefined!,
			count: 1,
			description: cleanDicePartDescription(description),
			fixedRolls: undefined!,
			manipulation: undefined!,
			modifier: 0,
			sides: 20,
			sign: undefined!,
			test: this.targetDataToTestData(target),
			target
		}) as DicePartType;
	}

	public static readonly reduceTokenToCore = reduceTokenToDicePartCore;

	public static readonly targetDataToTestData = targetDataToTestData;

	public static readonly GameType = GameType.Quest;
}

export class QuestDice extends Dice<DiceCore, QuestDicePart, GameType> {

	public static readonly Child = QuestDicePart as typeof DiceBase;

	public static readonly GameType = GameType.Quest;

	public static readonly gradeRoll = gradeRoll;

	public static readonly gradeToEmoji = gradeToEmoji;
}

export class QuestDiceGroup extends DiceGroup<DiceGroupCore, QuestDice, GameType> {

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

	public static readonly Child = QuestDice as typeof DiceBase;

	public static readonly GameType = GameType.Quest;

}
