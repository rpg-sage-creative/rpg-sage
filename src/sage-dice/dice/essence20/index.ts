//#region imports

import type { OrNull, OrUndefined, TParsers, TToken } from "../../../sage-utils";
import { toJSON } from "../../../sage-utils/utils/ClassUtils";
import { Tokenizer } from "../../../sage-utils/utils/StringUtils";
import { generate } from "../../../sage-utils/utils/UuidUtils";
import {
	cleanDescription,
	createValueTestData, DiceOutputType,
	DiceSecretMethodType, DropKeepType, GameType, rollDice, TDiceLiteral, TestType, TSign,
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
	parsers["bang"] = /\!/;
	parsers["target"] = /\b(vs\s*dif|dif|vs)\s*(\d+)/i;
	return parsers;
}
const EDGE = "Edge";
const SNAG = "Snag";
function reduceTokenToDicePartCore<T extends DicePartCore>(core: T, token: TToken, index: number, tokens: TToken[]): T {
	if (token.type === "bang") {
		const prevToken = tokens[index - 1];
		if (prevToken?.type === "dice") {
			core.specialization = true;
			return core;
		}
	}
	if (token.type === "target") {
		core.target = parseTargetData(token);
		return core;
	}
	const reduceSignToDropKeepData: TReduceSignToDropKeep[] = [];
	if (token.type === "dice") {
		reduceSignToDropKeepData.push(
			{ sign:"+" as TSign, type:DropKeepType.KeepHighest, value:1, alias:EDGE, test:_core => _core.sign === "+" },
			{ sign:"-" as TSign, type:DropKeepType.KeepLowest, value:1, alias:SNAG, test:_core => _core.sign === "-" }
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

//#region DicePart
interface DicePartCore extends baseDicePartCore {
	specialization?: boolean;
	target?: TTargetData;
}
type TDicePartCoreArgs = baseTDicePartCoreArgs & {
	specialization?: boolean;
	testOrTarget?: TTestData | TTargetData;
};
export class DicePart extends baseDicePart<DicePartCore, DicePartRoll> {
	public get hasSpecialiation(): boolean { return this.core.specialization === true; }
	//#region static
	public static create({ count, description, dropKeep, sides, specialization, testOrTarget }: TDicePartCoreArgs = {}): DicePart {
		return new DicePart({
			objectType: "DicePart",
			gameType: GameType.E20,
			id: generate(),

			count: count ?? 1,
			description: cleanDescription(description),
			dropKeep: dropKeep ?? undefined,
			modifier: 0,
			noSort: false,
			sides: sides ?? 0,
			sign: undefined,
			specialization,
			test: targetDataToTestData(<TTargetData>testOrTarget) ?? <TTestData>testOrTarget ?? null,
			target: <TTargetData>testOrTarget ?? null
		});
	}
	public static fromCore(core: DicePartCore): DicePart {
		return new DicePart(core);
	}
	public static fromTokens(tokens: TToken[]): DicePart {
		const core = tokens.reduce(reduceTokenToDicePartCore, <DicePartCore>{ description:"" });
		if (core.sides !== 20 && core.description.startsWith("!")) {
			core.specialization = true;
			core.description = core.description.slice(1);
		}
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
			gameType: GameType.E20,
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
	//#region static
	public static create(_dice: Dice): DiceRoll {
		return new DiceRoll({
			objectType: "DiceRoll",
			gameType: GameType.E20,
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
			gameType: GameType.E20,
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
		const skillDicePart = DicePart.fromTokens(tokens);
		const skillDice = Dice.create([skillDicePart]);
		const dice = [skillDice];

		if (skillDicePart.sides !== 20) {
			const d20DicePartCore: DicePartCore = {
				objectType: "DicePart",
				gameType: GameType.E20,
				id: generate(),
				count: 1,
				sides: 20,
				description: "",
				modifier: 0,
				noSort: false
			};
			if (skillDicePart.hasDropKeep) {
				d20DicePartCore.count = 2;
				d20DicePartCore.dropKeep = skillDicePart.dropKeep;
				delete skillDicePart.toJSON().dropKeep;
			}
			const d20DicePart = new DicePart(d20DicePartCore);
			const d20Dice = Dice.create([d20DicePart]);
			dice.unshift(d20Dice);
		}else {
			if (skillDicePart.hasDropKeep) {
				skillDicePart.toJSON().count = 2;
			}
		}

		const sides = skillDicePart.sides;
		const diceSides = [2,4,6,8,10,12];
		if (skillDicePart.hasSpecialiation && sides > 2 && diceSides.includes(sides)) {
			for (let index = diceSides.indexOf(sides); index--;) {
				dice.push(Dice.create([new DicePart({
					objectType: "DicePart",
					gameType: GameType.E20,
					id: generate(),
					count: 1,
					sides: diceSides[index],
					description: "",
					modifier: 0,
					noSort: false
				})]));
			}
		}
		return DiceGroup.create(dice, diceOutputType);
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
		const d20Roll = this.rolls[0];
		const baseRoll: DiceRoll | undefined = this.rolls[1];
		const slicedRolls = this.rolls.slice(1);
		const highestRoll: DiceRoll | undefined = slicedRolls.reduce((highest, roll) => !highest || roll.total > highest.total ? roll : highest, undefined as DiceRoll | undefined);
		const maxRoll = slicedRolls.find(roll => (roll.dice.baseDicePart?.sides ?? 0) > 2 && roll.rolls.find(dpRoll => dpRoll.maxCount));

		const description = baseRoll?.dice.baseDicePart?.description ?? d20Roll.dice.baseDicePart?.description;
		const total = d20Roll.total + (highestRoll?.total ?? 0);

		const test = baseRoll?.dice.test ?? d20Roll.dice.test;
		let dif = "";
		let emoji = "";
		if (test) {
			if (total >= test.value) {
				emoji = maxRoll ? "[critical-success]" : "[success]";
			}else {
				emoji = d20Roll.isMin ? "[critical-failure]" : "[failure]";
			}
			dif = `DIF ${test.value}`;
		}else if (maxRoll) {
			emoji = "[critical-success]";
		}else if (d20Roll.isMin) {
			emoji = "[critical-failure]";
		}

		const parts = this.rolls.map((roll, index) => {
			const out = roll.toString(DiceOutputType.M).split(/⟵/)[1].split(/\bdif\b/)[0].trim();
			if (index && roll !== highestRoll) {
				return `<s>${out}</s>`;
			}
			return out;
		});

		const desc = description ? `\`${description}\`` : "";
		return `${emoji} <b>${total}</b> ${dif} ${desc} ⟵ ${parts.join("; ")}`.replace(/\s+/g, " ");
	}
	public static create(diceGroup: DiceGroup): DiceGroupRoll {
		return new DiceGroupRoll({
			objectType: "DiceGroupRoll",
			gameType: GameType.E20,
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
