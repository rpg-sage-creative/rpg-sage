//#region imports

import type { OrNull, TParsers, TToken } from "../../../sage-utils";
import type {
	TDiceLiteral,
	TTestData
} from "../../common";
import {
	cleanDescription,
	createValueTestData, DiceOutputType,
	DiceSecretMethodType,
	DieRollGrade,
	GameType, gradeToEmoji,
	rollDice, TestType
} from "../../common";
import type {
	DiceCore as baseDiceCore, DiceGroupCore as baseDiceGroupCore,
	DiceGroupRollCore as baseDiceGroupRollCore, DicePartCore as baseDicePartCore,
	DicePartRollCore as baseDicePartRollCore, DiceRollCore as baseDiceRollCore, TDicePartCoreArgs as baseTDicePartCoreArgs
} from "../base/types";
import {
	Dice as baseDice, DiceGroup as baseDiceGroup,
	DiceGroupRoll as baseDiceGroupRoll, DicePart as baseDicePart,
	DicePartRoll as baseDicePartRoll, DiceRoll as baseDiceRoll
} from "../base";
import { generate } from "../../../sage-utils/utils/UuidUtils";
import { toJSON } from "../../../sage-utils/utils/ClassUtils";
import { Tokenizer } from "../../../sage-utils/utils/StringUtils";

//#endregion

/*
default target ("VS") = 8

roll xd12

for each die:
 - 1 is crit fail
 - < VS fail == -1 success
 - VS+ 1 success
 - 12 1 success plus crit die

 for each 12, roll another die:
 - < VS 1 success
 -VS+ 2 successes plus crit die

add/subtract successes
 - 1+ success
 - 0 fail
 - < 0 critical failure
*/

//#region Tokenizer

function getParsers(): TParsers {
	return {
		dice: /\s*(\d+)?\s*d\s*(12)/i,
		target: /(vs)\s*(\d+)/i
	};
}

function reduceTokenToDicePartCore<T extends DicePartCore>(core: T, token: TToken): T {
	if (token.type === "dice") {
		core.sides = +token.matches[0];
		core.count = 12;
	}else if (token.type === "target") {
		core.target = { type:TargetType.VS, value:+(token.matches ?? [])[1] ?? 0 };
	}else {
		core.description = (core.description ?? "") + token.token;
	}
	return core;
}

//#endregion

//#region Targets/Tests

enum TargetType { None = 0, VS = 1 }

type TTargetData = { type:TargetType; value:number; };

function targetDataToTestData(targetData: TTargetData): OrNull<TTestData> {
	return !targetData ? null : createValueTestData(TestType.GreaterThanOrEqual, targetData.value, "vs");
}

//#endregion

//#region Grades

function gradeResults(roll: DiceRoll): DieRollGrade {
	const test = roll.dice.test;
	const vs = test?.value ?? 8;
	if (roll.total === 12) {
		return DieRollGrade.CriticalSuccess;
	}else if (roll.total >= vs) {
		return DieRollGrade.Success;
	}else if (roll.total > 1) {
		return DieRollGrade.Failure;
	}else if (roll.total === 1) {
		return DieRollGrade.CriticalFailure;
	}else {
		return DieRollGrade.Unknown;
	}
}

//#endregion

//#region diceGroupRollToString

function _gradeEmoji(grade: DieRollGrade, vs: boolean): string {
	if (vs) {
		return gradeToEmoji(grade) ?? `:question:`;
	}
	return gradeToEmoji(grade) ?? `:bangbang:`;
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
	//#region static
	public static create({ description, testOrTarget }: TDicePartCoreArgs = {}): DicePart {
		return new DicePart({
			objectType: "DicePart",
			gameType: GameType.CnC,
			id: generate(),

			count: 1,
			description: cleanDescription(description),
			dropKeep: undefined,
			modifier: 0,
			noSort: false,
			sides: 12,
			sign: undefined,
			test: targetDataToTestData(<TTargetData>testOrTarget) ?? <TTestData>testOrTarget ?? null,
			target: <TTargetData>testOrTarget ?? null
		});
	}
	public static fromCore(core: DicePartCore): DicePart {
		return new DicePart(core);
	}
	public static fromTokens(tokens: TToken[]): DicePart {
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
		return new DicePartRoll({
			objectType: "DicePartRoll",
			gameType: GameType.CnC,
			id: generate(),
			dice: dicePart.toJSON(),
			rolls: rollDice(dicePart.count, dicePart.sides)
		});
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
			gameType: GameType.CnC,
			id: generate(),
			diceParts: diceParts.map<DicePartCore>(toJSON)
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
	public toString(): string { return `${this.total} ${_gradeEmoji(gradeResults(this), this.dice.hasTest)}`; }
	//#region static
	public static create(_dice: Dice): DiceRoll {
		return new DiceRoll({
			objectType: "DiceRoll",
			gameType: GameType.CnC,
			id: generate(),
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

type DiceGroupCore = baseDiceGroupCore;

export class DiceGroup extends baseDiceGroup<DiceGroupCore, Dice, DiceGroupRoll> {
	//#region static
	public static create(_dice: Dice[], diceOutputType?: DiceOutputType): DiceGroup {
		return new DiceGroup({
			objectType: "DiceGroup",
			gameType: GameType.CnC,
			id: generate(),
			critMethodType: undefined,
			dice: _dice.map<DiceCore>(toJSON),
			diceOutputType: diceOutputType,
			diceSecretMethodType: DiceSecretMethodType.Ignore
		});
	}
	public static fromCore(core: DiceGroupCore): DiceGroup {
		return new DiceGroup(core);
	}
	public static fromTokens(tokens: TToken[], diceOutputType?: DiceOutputType): DiceGroup {
		return DiceGroup.create([Dice.create([DicePart.fromTokens(tokens)])], diceOutputType);
	}
	public static parse(diceString: string, diceOutputType?: DiceOutputType): DiceGroup {
		const tokens = Tokenizer.tokenize(diceString, getParsers(), "desc");
		return DiceGroup.fromTokens(tokens, diceOutputType);
	}
	public static Part = <typeof baseDice>Dice;
	public static Roll: typeof baseDiceGroupRoll;
	//#endregion
}

//#endregion

//#region DiceGroupRoll

type DiceGroupRollCore = baseDiceGroupRollCore;

export class DiceGroupRoll extends baseDiceGroupRoll<DiceGroupRollCore, DiceGroup, DiceRoll> {
	public toString(outputType: DiceOutputType): string;
	public toString(): string {
		return this.rolls[0].toString();
	}
	public static create(diceGroup: DiceGroup): DiceGroupRoll {
		return new DiceGroupRoll({
			objectType: "DiceGroupRoll",
			gameType: GameType.CnC,
			id: generate(),
			diceGroup: diceGroup.toJSON(),
			rolls: diceGroup.dice.map(_dice => _dice.roll().toJSON())
		});
	}
	public static fromCore(core: DiceGroupRollCore): DiceGroupRoll {
		return new DiceGroupRoll(core);
	}
	public static Dice = <typeof baseDiceGroup>DiceGroup;
}

DiceGroup.Roll = <typeof baseDiceGroupRoll>DiceGroupRoll;

//#endregion
