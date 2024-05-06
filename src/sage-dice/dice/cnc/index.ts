import { GameType } from "@rsc-sage/types";
import { ExplodeDice, rollDice } from "@rsc-utils/dice-utils";
import { randomSnowflake } from "@rsc-utils/snowflake-utils";
import { cleanWhitespace, tokenize, type TokenData, type TokenParsers } from "@rsc-utils/string-utils";
import type { OrNull } from "@rsc-utils/type-utils";
import type {
	TDiceLiteral,
	TTestData
} from "../../common";
import {
	DiceOutputType,
	DiceSecretMethodType,
	DieRollGrade,
	TestType, UNICODE_LEFT_ARROW,
	cleanDescription,
	gradeToEmoji,
	parseTestTargetValue
} from "../../common";
import {
	Dice as baseDice, DiceGroup as baseDiceGroup,
	DiceGroupRoll as baseDiceGroupRoll, DicePart as baseDicePart,
	DicePartRoll as baseDicePartRoll, DiceRoll as baseDiceRoll
} from "../base";
import type {
	DiceCore as baseDiceCore, DiceGroupCore as baseDiceGroupCore,
	DiceGroupRollCore as baseDiceGroupRollCore, DicePartCore as baseDicePartCore,
	DicePartRollCore as baseDicePartRollCore, DiceRollCore as baseDiceRollCore, TDicePartCoreArgs as baseTDicePartCoreArgs
} from "../base/types";

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

function getParsers(): TokenParsers {
	return {
		dice: /\s*(\d+)?\s*d\s*(12)/i,
		target: /(vs)\s*(\d+)/i
	};
}

function reduceTokenToDicePartCore<T extends DicePartCore>(core: T, token: TokenData): T {
	if (token.key === "dice") {
		core.count = +token.matches[0];
		core.sides = 12;
	}else if (token.key === "target") {
		const { value, hidden } = parseTestTargetValue(token.matches[1]);
		core.target = { type:TargetType.VS, value, hidden };
	}else {
		core.description = (core.description ?? "") + token.token;
	}
	return core;
}

//#endregion

//#region Targets/Tests

enum TargetType { None = 0, VS = 1 }

type TTargetData = { type:TargetType; value:number; hidden:boolean; };

function targetDataToTestData(targetData: TTargetData): OrNull<TTestData> {
	if (!targetData) return null;
	const { value, hidden } = targetData;
	return { alias:"vs", type: TestType.GreaterThanOrEqual, value, hidden };
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
	const grade = totalSuccesses === 0 ? DieRollGrade.Failure
		: totalSuccesses < 0 ? DieRollGrade.CriticalFailure
		: DieRollGrade.Success;

	return [grade, values];
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
	public static create({ count, description, testOrTarget }: TDicePartCoreArgs = {}): DicePart {
		return new DicePart({
			objectType: "DicePart",
			gameType: GameType.CnC,
			id: randomSnowflake(),

			count: count ?? 1,
			description: cleanDescription(description),
			dropKeep: undefined,
			modifier: 0,
			noSort: false,
			sides: 12,
			sign: undefined,
			test: targetDataToTestData(testOrTarget as TTargetData) ?? testOrTarget as TTestData ?? null,
			target: testOrTarget as TTargetData ?? null
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
		return new DicePartRoll({
			objectType: "DicePartRoll",
			gameType: GameType.CnC,
			id: randomSnowflake(),
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
	public toString(): string {
		const baseValues = this.rolls[0].rolls;
		const critValues = this.rolls[1]?.rolls ?? [];
		const vs = this.dice.test?.value ?? 8;
		const vsOutput = vs !== 8 ? ` vs ${vs} ` : ``;
		const [grade, gradeValues] = gradeRoll(baseValues, critValues, vs);
		const gradeOutput = gradeToEmoji(grade);
		const baseOutput = ` [${baseValues.join(",")}]${baseValues.length}d12 ${vsOutput} (**${gradeValues[0]}**)`;
		const critOutput = critValues.length ? ` + [${critValues.join(",")}]${critValues.length}d12 ${vsOutput} (**${gradeValues[5]}**)` : ``;
		const totalSuccesses = critValues.length ? ` -> **${gradeValues[0] + gradeValues[5]}**` : ``;
		const desc = this.dice.diceParts.find(dp => dp.hasDescription)?.description;
		const descOutput = desc ? "`" + desc + "`" : "";
		return cleanWhitespace(`${gradeOutput} ${descOutput} ${UNICODE_LEFT_ARROW} ${baseOutput} ${critOutput} ${totalSuccesses}`);
	}

	//#region static
	public static create(_dice: Dice): DiceRoll {
		const dicePartsRolls = _dice.diceParts.map(dicePart => dicePart.roll());
		const dicePartsRollsJson = dicePartsRolls.map(dicePartRoll => dicePartRoll.toJSON());
		const explodedDice: number[] = [];
		dicePartsRolls.forEach(dicePartRoll => {
			explodedDice.push(...ExplodeDice.explode(12, dicePartRoll.rolls));
		});
		if (explodedDice.length) {
			dicePartsRollsJson.push({
				objectType: "DicePartRoll",
				gameType: GameType.CnC,
				id: randomSnowflake(),
				dice: {
					objectType: "DicePart",
					gameType: GameType.CnC,
					id: randomSnowflake(),
					count: explodedDice.length,
					sides: 12,
					description: "Crit Dice",
					modifier: 0,
					noSort: false
				},
				rolls: explodedDice
			});
		}
		return new DiceRoll({
			objectType: "DiceRoll",
			gameType: GameType.CnC,
			id: randomSnowflake(),
			dice: _dice.toJSON(),
			rolls: dicePartsRollsJson
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
			id: randomSnowflake(),
			critMethodType: undefined,
			dice: _dice.map<DiceCore>(DiceGroup.toJSON),
			diceOutputType: diceOutputType,
			diceSecretMethodType: DiceSecretMethodType.Ignore
		});
	}
	public static fromCore(core: DiceGroupCore): DiceGroup {
		return new DiceGroup(core);
	}
	public static fromTokens(tokens: TokenData[], diceOutputType?: DiceOutputType): DiceGroup {
		return DiceGroup.create([Dice.create([DicePart.fromTokens(tokens)])], diceOutputType);
	}
	public static parse(diceString: string, diceOutputType?: DiceOutputType): DiceGroup {
		const tokens = tokenize(diceString, getParsers(), "desc");
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
			id: randomSnowflake(),
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
