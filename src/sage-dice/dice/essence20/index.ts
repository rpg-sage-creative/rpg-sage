//#region imports

import type { OrNull, OrUndefined, TParsers, TToken } from "../../../sage-utils";
import { toJSON } from "../../../sage-utils/utils/ClassUtils";
import { Tokenizer } from "../../../sage-utils/utils/StringUtils";
import { generate } from "../../../sage-utils/utils/UuidUtils";
import {
	cleanDescription,
	createValueTestData, DiceOutputType,
	DiceSecretMethodType, DropKeepType, GameType, rollDice, TDiceLiteral, TestType, TTestData
} from "../../common";
import {
	Dice as baseDice, DiceGroup as baseDiceGroup,
	DiceGroupRoll as baseDiceGroupRoll, DicePart as baseDicePart,
	DicePartRoll as baseDicePartRoll, DiceRoll as baseDiceRoll, getParsers as baseGetParsers,
	reduceTokenToDicePartCore as baseReduceTokenToDicePartCore
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
	parsers["suffix"] = /(e|s|\*|up\d+|dn\d+)+/i;
	parsers["target"] = /\b(vs\s*dif|dif|vs)\s*(\d+)/i;
	return parsers;
}

function applyEdgeSnagSpecShift<T extends DicePartCore>({ core, hasEdge, hasSnag, hasSpecialization, upShift, downShift }: { core: T, hasEdge: boolean, hasSnag: boolean, hasSpecialization: boolean, upShift: number, downShift: number }): T {
	if (hasEdge && !hasSnag) {
		core.dropKeep = { type:DropKeepType.KeepHighest, value:1 };
	}else if (!hasEdge && hasSnag) {
		core.dropKeep = { type:DropKeepType.KeepLowest, value:1 };
	}
	if (hasSpecialization) {
		core.sign = "+";
		core.specialization = true;
	}
	// use || instead of ?? in case we have a 0
	core.upShift = upShift || undefined;
	core.downShift = downShift || undefined;
	return core;
}

function reduceTokenToDicePartCore<T extends DicePartCore>(core: T, token: TToken, index: number, tokens: TToken[]): T {
	if (token.type === "suffix") {
		const prevToken = tokens[index - 1];
		if (prevToken?.type === "dice") {
			return applyEdgeSnagSpecShift({
				core,
				hasEdge: token.token.match(/e/i) !== null,
				hasSnag: token.token.match(/s/i) !== null,
				hasSpecialization: token.token.includes("*"),
				upShift: +(token.token.match(/up(\d+)/i)?.[1] ?? 0),
				downShift: +(token.token.match(/dn(\d+)/i)?.[1] ?? 0)
			});
		}
	}
	if (token.type === "target") {
		core.target = parseTargetData(token);
		return core;
	}
	return baseReduceTokenToDicePartCore(core, token, index, tokens);
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

//#region helpers
export type TSkillDie = "d20" | "d2" | "d4" | "d6" | "d8" | "d10" | "d12" | "2d8" | "3d6";
/** return ["d20","d2","d4","d6","d8","d10","d12","2d8","3d6"]; */
function getLadder(): TSkillDie[] {
	return ["d20","d2","d4","d6","d8","d10","d12","2d8","3d6"];
}

type TShiftArrow = "↑" | "↓" | "";
type TDieShift = {
	skillDie: TSkillDie;
	shiftedDie: TSkillDie;
	shiftArrow: TShiftArrow;
	shiftNumber: number;
};

/** shiftValues *need* to be "+1" or "-1" (no spaces; sign required), not up1 or dn1 */
export function shiftDie(skillDie: TSkillDie, shiftValues: string[]): TDieShift {
	const ladder = getLadder();

	const skillIndex = ladder.indexOf(skillDie);
	let shiftedIndex = skillIndex;
	ladder.forEach((_, stepNumber) => {
		if (shiftValues.includes(`+${stepNumber}`)) { shiftedIndex += stepNumber; }
		// if (shiftValues.includes(`↑${stepNumber}`)) { shiftedIndex += stepNumber; }
		if (shiftValues.includes(`-${stepNumber}`)) { shiftedIndex -= stepNumber; }
		// if (shiftValues.includes(`↓${stepNumber}`)) { shiftedIndex -= stepNumber; }
	});
	const minIndex = 0, maxIndex = ladder.length - 1;
	shiftedIndex = Math.min(Math.max(shiftedIndex, minIndex), maxIndex);

	let shiftNumber = 0;
	let shiftArrow: TShiftArrow = "";
	if (skillIndex !== shiftedIndex) {
		shiftNumber = shiftedIndex - skillIndex;
		shiftArrow = skillIndex < shiftedIndex ? "↑" : "↓";
	}

	const shiftedDie = ladder[shiftedIndex];

	return { skillDie, shiftedDie, shiftArrow, shiftNumber };
}
//#endregion

//#region DicePart
interface DicePartCore extends baseDicePartCore {
	downShift?: number;
	upShift?: number;
	specialization?: boolean;
	target?: TTargetData;
}
type TDicePartCoreArgs = baseTDicePartCoreArgs & {
	downShift?: number;
	upShift?: number;
	specialization?: boolean;
	testOrTarget?: TTestData | TTargetData;
};
export class DicePart extends baseDicePart<DicePartCore, DicePartRoll> {
	public get hasShift(): boolean { return this.upShift + this.downShift !== 0; }
	public get upShift(): number { return this.core.upShift ?? 0; }
	public get downShift(): number { return this.core.downShift ?? 0; }
	public get hasSpecialization(): boolean { return this.core.specialization === true; }
	//#region static
	public static create({ count, description, dropKeep, sides, sign, specialization, testOrTarget, downShift, upShift }: TDicePartCoreArgs = {}): DicePart {
		return new DicePart({
			objectType: "DicePart",
			gameType: GameType.E20,
			id: generate(),

			count: count ?? 1,
			description: cleanDescription(description),
			dropKeep: dropKeep ?? undefined,
			downShift: downShift ?? undefined,
			modifier: 0,
			noSort: false,
			sides: sides ?? 0,
			sign: sign,
			specialization,
			test: targetDataToTestData(<TTargetData>testOrTarget) ?? <TTestData>testOrTarget ?? null,
			target: <TTargetData>testOrTarget ?? null,
			upShift: upShift ?? undefined
		});
	}
	public static fromCore(core: DicePartCore): DicePart {
		return new DicePart(core);
	}
	public static fromTokens(tokens: TToken[]): DicePart {
		const core = tokens.reduce(reduceTokenToDicePartCore, <DicePartCore>{ description:"" });
		if (core.sides !== 20 && match(core)) {
			let hasEdge = false, hasSnag = false, hasSpecialization = false, downShift = 0, upShift = 0;
			//#region collect the flags
			while (match(core)) {
				let sliceLength = 1;
				//#region edge
				if (match(core, /^e/i)) {
					hasEdge = true;
				}
				//#endregion
				//#region snag
				if (match(core, /^s/i)) {
					hasSnag = true;
				}
				//#endregion
				//#region specialization
				if (match(core, /^\*/i)) {
					hasSpecialization = true;
				}
				//#endregion
				//#region upShift
				const upMatch = match(core, /(↑|up)(\d*)/i);
				if (upMatch) {
					upShift = +upMatch[2];
					sliceLength = upMatch[0].length;
				}
				//#endregion
				//#region downShift
				const downMatch = match(core, /(↓|dn)(\d*)/i);
				if (downMatch) {
					downShift = +downMatch[2];
					sliceLength = downMatch[0].length;
				}
				//#endregion
				core.description = core.description.slice(sliceLength);
			}
			//#endregion
			applyEdgeSnagSpecShift({ core, hasEdge, hasSnag, hasSpecialization, downShift, upShift });
		}
		const args = <TDicePartCoreArgs>{ testOrTarget:core.target ?? core.test, ...core };
		return DicePart.create(args);

		function match(core: DicePartCore, regex = /^(e|s|\*|↑\d*|up\d+|↓\d*|dn\d+)+/i): RegExpMatchArray | null {
			return core.description.match(regex);
		}
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
		if (skillDicePart.hasShift) {
			const { upShift, downShift } = skillDicePart;
			const skillDie = `${skillDicePart.count}d${skillDicePart.sides}`.replace(/^1d/, "d") as TSkillDie;
			const { shiftedDie, shiftArrow, shiftNumber } = shiftDie(skillDie, [`+${upShift}`, `-${downShift}`]);
			const [count, sides] = shiftedDie.split("d");
			const core = skillDicePart.toJSON();
			core.count = +count || 1;
			core.sides = +sides;
			core.description += `${core.description?" ":""}(${skillDie}${shiftArrow}${shiftNumber})`;
		}
		const skillDice = Dice.create([skillDicePart]);
		const dice = [skillDice];
		if (skillDicePart.sides !== 20 && skillDicePart.sign === "+") {
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

		const step = `${skillDicePart.count}d${skillDicePart.sides}`.replace(/^1d/, "d") as TSkillDie;
		if (skillDicePart.hasSpecialization) {
			const specializationLadder = getLadder().slice(1);
			if (specializationLadder.indexOf(step) > 0) {
				for (let index = specializationLadder.indexOf(step); index--;) {
					const [count, sides] = specializationLadder[index].split("d");
					dice.push(Dice.create([new DicePart({
						objectType: "DicePart",
						gameType: GameType.E20,
						id: generate(),
						count: +count || 1,
						sides: +sides,
						description: "",
						modifier: 0,
						noSort: false
					})]));
				}
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
