//#region imports

import type { OrNull, OrUndefined, TParsers, TToken } from "../../../sage-utils";
import utils from "../../../sage-utils";
import {
	cleanDescription,
	createValueTestData, DiceOutputType,
	DiceSecretMethodType,
	DieRollGrade, DropKeepType, GameType, gradeToEmoji,
	rollDice, TDiceLiteral, TestType, TSign,
	TTestData
} from "../../common";
import {
	Dice as baseDice, DiceGroup as baseDiceGroup,
	DiceGroupRoll as baseDiceGroupRoll, DicePart as baseDicePart,
	DicePartRoll as baseDicePartRoll, DiceRoll as baseDiceRoll, getParsers as baseGetParsers,
	reduceTokenToDicePartCore as baseReduceTokenToDicePartCore,
	TReduceSignToDropKeep
} from "../base";
import type {
	DiceCore as baseDiceCore, DiceGroupCore as baseDiceGroupCore,
	DiceGroupRollCore as baseDiceGroupRollCore, DicePartCore as baseDicePartCore,
	DicePartRollCore as baseDicePartRollCore, DiceRollCore as baseDiceRollCore, TDicePartCoreArgs as baseTDicePartCoreArgs
} from "../base/types";

//#endregion

//#region Tokenizer
function getParsers(): TParsers {
	const parsers = baseGetParsers();
	parsers["target"] = /(vs\s*dif|dif|vs)\s*(\d+)/i;
	return parsers;
}
const ADVANTAGE = "Advantage";
const DISADVANTAGE = "Disadvantage";
function reduceTokenToDicePartCore<T extends DicePartCore>(core: T, token: TToken, index: number, tokens: TToken[]): T {
	if (token.type === "target") {
		core.target = parseTargetData(token);
		return core;
	}
	const reduceSignToDropKeepData: TReduceSignToDropKeep[] = [];
	if (token.type === "dice") {
		reduceSignToDropKeepData.push(
			{ sign:"+" as TSign, type:DropKeepType.KeepHighest, value:1, alias:ADVANTAGE },
			{ sign:"-" as TSign, type:DropKeepType.KeepLowest, value:1, alias:DISADVANTAGE }
		);
	}
	return baseReduceTokenToDicePartCore(core, token, index, tokens, reduceSignToDropKeepData);
}
//#endregion

//#region Targets/Tests
enum TargetType { None = 0, DIF = 1 }
type TTargetData = { type:TargetType; value:number; raw:string; };
function parseTargetData(token: TToken): OrUndefined<TTargetData> {
	if (token.matches) {
		const type = TargetType.DIF,
			value = +token.matches[1] || 0;
		return { type:type, value:value, raw:token.token };
	}
	return undefined;
}
function targetDataToTestData(targetData: TTargetData): OrNull<TTestData> {
	return !targetData ? null : createValueTestData(TestType.GreaterThanOrEqual, targetData.value, "dif");
}
//#endregion

//#region Grades
function gradeResults(roll: DiceRoll): DieRollGrade {
	if (!roll.dice.hasTest) {
		return DieRollGrade.Unknown;
	}
	if (roll.total >= roll.dice.test!.value) {
		return roll.isMax
			? DieRollGrade.CriticalSuccess
			: DieRollGrade.Success;
	}
	/** @todo CHECK d20 FOR NAT 1 for crit fumble; return DieRollGrade.CriticalFailure; */
	return DieRollGrade.Failure;
}
//#endregion

//#region diceGroupRollToString
function _gradeEmoji(grade: DieRollGrade, vs: boolean): string {
	if (vs) {
		return gradeToEmoji(grade) || `:E20ion:`;
	}
	return gradeToEmoji(grade) || `:bangbang:`;
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
			gameType: GameType.E20,
			id: utils.UuidUtils.generate(),

			count: 1,
			description: cleanDescription(description),
			dropKeep: undefined,
			modifier: 0,
			noSort: false,
			sides: 20,
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
			gameType: GameType.E20,
			id: utils.UuidUtils.generate(),
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
			gameType: GameType.E20,
			id: utils.UuidUtils.generate(),
			diceParts: diceParts.map<DicePartCore>(utils.ClassUtils.toJSON)
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
			gameType: GameType.E20,
			id: utils.UuidUtils.generate(),
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
			gameType: GameType.E20,
			id: utils.UuidUtils.generate(),
			critMethodType: undefined,
			dice: _dice.map<DiceCore>(utils.ClassUtils.toJSON),
			diceOutputType: diceOutputType,
			diceSecretMethodType: DiceSecretMethodType.Ignore
		});
	}
	public static fromCore(core: DiceGroupCore): DiceGroup {
		return new DiceGroup(core);
	}
	public static fromTokens(tokens: TToken[], diceOutputType?: DiceOutputType): DiceGroup {
		const skillDicePart = DicePart.fromTokens(tokens);
		const d20DicePartCore: DicePartCore = {
			objectType: "DicePart",
			gameType: GameType.E20,
			id: utils.UuidUtils.generate(),
			count: 2,
			sides: 20,
			description: "",
			modifier: 0,
			noSort: false
		};
		const sign = skillDicePart.sign;
		if (sign === "+" || sign === "-") {
			d20DicePartCore.dropKeep = {
				type: sign === "+" ? DropKeepType.KeepHighest : DropKeepType.DropLowest,
				value: 1,
				alias: sign === "+" ? "Advantage" : "Disadvantage"
			};
		}
		const d20DicePart = new DicePart(d20DicePartCore);
		const diceParts = [d20DicePart, skillDicePart];
		return DiceGroup.create([Dice.create(diceParts)], diceOutputType);
	}
	public static parse(diceString: string, diceOutputType?: DiceOutputType): DiceGroup {
		const tokens = utils.StringUtils.Tokenizer.tokenize(diceString, getParsers(), "desc");
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
			gameType: GameType.E20,
			id: utils.UuidUtils.generate(),
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
