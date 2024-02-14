import { Dice, DiceBase, DiceCore, DiceGroup, DiceGroupCore, DiceGroupCoreArgs, DicePart, DicePartCore, DicePartCoreArgs, DiceTest, DiceTestType, DieRollGrade, TDice, TDiceGroup, TDicePart, cleanDicePartDescription, gradeToEmoji, parseDiceTestTargetValue, type DiceTestData } from "@rsc-utils/dice-utils";
import { randomSnowflake } from "@rsc-utils/snowflake-utils";
import { type TokenData, type TokenParsers } from "@rsc-utils/string-utils";
import { type OrNull } from "@rsc-utils/type-utils";
import { GameType } from "../../../sage-common";
import { DiceSecretMethodType } from "../../common";

//#region Tokenizer

function getDiceTokenParsers(): TokenParsers {
	return {
		dice: /\s*(1)?\s*d\s*(20)/i,
		target: /(vs)\s*(\d+|\|\|\d+\|\|)/i
	};
}

function reduceTokenToDicePartCore<T extends QuestDicePartCore>(core: T, token: TokenData): T {
	if (token.key === "dice") {
		core.count = 1;
		core.sides = 20;
	}else if (token.key === "target") {
		const { value, hidden } = parseDiceTestTargetValue(token.matches[1]);
		core.target = { type:TargetType.VS, value, hidden };
	}else {
		core.description = (core.description || "") + token.token;
	}
	return core;
}

//#endregion

//#region Targets/Tests

enum TargetType { None = 0, VS = 1 }

type TTargetData = { type:TargetType; value:number; hidden:boolean; };

function targetDataToTestData(targetData: TTargetData): OrNull<DiceTestData> {
	return !targetData ? null : DiceTest.createData(DiceTestType.GreaterThan, targetData.value, targetData.hidden, "vs");
}

//#endregion

//#region Grades

function gradeResults(dice: QuestDice): DieRollGrade {
	const test = dice.test;
	if (test) {
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

//#endregion

function _gradeEmoji(grade: DieRollGrade, vs: boolean): string {
	if (vs) {
		return gradeToEmoji(grade) || `:question:`;
	}
	return gradeToEmoji(grade) || `:bangbang:`;
}

type QuestDicePartCore = DicePartCore & {
	target?: TTargetData;
};

type QuestDicePartCoreArgs = DicePartCoreArgs & {
	testOrTarget?: DiceTestData | TTargetData;
};

export class QuestDicePart extends DicePart<QuestDicePartCore, GameType> {

	public static create<DicePartType extends TDicePart>({ description, testOrTarget }: QuestDicePartCoreArgs = {}): DicePartType {
		return new this({
			objectType: "DicePart",
			gameType: this.GameType,
			id: randomSnowflake(),

			count: 1,
			description: cleanDicePartDescription(description),
			manipulation: undefined!,
			modifier: 0,
			fixedRolls: undefined!,
			sides: 20,
			sign: undefined!,
			test: targetDataToTestData(testOrTarget as TTargetData) ?? testOrTarget as DiceTestData ?? null,
			target: testOrTarget as TTargetData ?? null,

			children: undefined!
		}) as DicePartType;
	}

	public static readonly reduceTokenToCore = reduceTokenToDicePartCore;

	public static readonly GameType = GameType.Quest;
}

export class QuestDice extends Dice<DiceCore, QuestDicePart, GameType> {

	public static readonly Child = QuestDicePart as typeof DiceBase;

	public static readonly GameType = GameType.Quest;
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

	public static readonly getTokenParsers = getDiceTokenParsers;

	public static readonly Child = QuestDice as typeof DiceBase;

	public static readonly GameType = GameType.Quest;

}
