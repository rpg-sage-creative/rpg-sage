import { randomSnowflake, tokenize, type OrNull, type OrUndefined, type TokenData, type TokenParsers } from "@rsc-utils/core-utils";
import { rollDice } from "@rsc-utils/dice-utils";
import { GameSystemType } from "@rsc-utils/game-utils";
import {
	DiceOutputType,
	DiceSecretMethodType, DropKeepType,
	TestType,
	cleanDescription,
	createValueTestData,
	parseTestTargetValue,
	type TDiceLiteral,
	type TTestData
} from "../../common.js";
import {
	Dice as baseDice, DiceGroup as baseDiceGroup,
	DiceGroupRoll as baseDiceGroupRoll, DicePart as baseDicePart,
	DicePartRoll as baseDicePartRoll, DiceRoll as baseDiceRoll, getParsers as baseGetParsers,
	reduceTokenToDicePartCore as baseReduceTokenToDicePartCore
} from "../base/index.js";
import type {
	DiceCore as baseDiceCore, DiceGroupCore as baseDiceGroupCore,
	DiceGroupRollCore as baseDiceGroupRollCore, DicePartCore as baseDicePartCore,
	DicePartRollCore as baseDicePartRollCore, DiceRollCore as baseDiceRollCore, TDicePartCoreArgs as baseTDicePartCoreArgs
} from "../base/types.js";
import { correctEscapeForEmoji } from "../index.js";

//#region test dice
/*
[+d4dn5 is fumble]
[+d4dn4 is fumble]
[+d4dn3 is fail]
[+d4dn2 is twenty]
[+d4dn1 is two]
[+d4]
[+d4up1 is six]
[+d4up2 is eight]
[+d4up3 is ten]
[+d4up4 is twelve]
[+d4up5 is 2 eights]
[+d4up6 is 3 sixes]
[+d4up7 is success]
[+d4up8 is critical]
[+d4up9 is critical]
*/
/*
[+d4dn5* is fumble]
[+d4dn4* is fumble]
[+d4dn3* is fail]
[+d4dn2* is twenty]
[+d4dn1* is two]
[+d4*]
[+d4up1* is six]
[+d4up2* is eight]
[+d4up3* is ten]
[+d4up4* is twelve]
[+d4up5* is 2 eights]
[+d4up6* is 3 sixes]
[+d4up7* is success]
[+d4up8* is critical]
[+d4up9* is critical]
*/
//#endregion

//#region Tokenizer
function getParsers(): TokenParsers {
	const parsers = baseGetParsers();
	parsers["suffix"] = /(e|s|\*|up\d+|dn\d+)+/i;
	parsers["target"] = /\b(vs\s*dif|dif|vs)\s*(\d+|\|\|\d+\|\|)/i;
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

function tallyShifts(text: string, shift: "up" | "down"): number {
	const regex = shift === "up" ? /(↑|up)\d+/gi : /(↓|dn)\d+/gi;
	const matches = text.match(regex) ?? [];
	const values = matches.map(match => +match.replace(/↑|up|↓|dn/ig, ""));
	return values.reduce((out, value) => out + value, 0);
}

function reduceTokenToDicePartCore<T extends DicePartCore>(core: T, token: TokenData, index: number, tokens: TokenData[]): T {
	if (token.key === "suffix") {
		const prevToken = tokens[index - 1];
		if (prevToken?.key === "dice") {
			return applyEdgeSnagSpecShift({
				core,
				hasEdge: token.token.match(/e/i) !== null,
				hasSnag: token.token.match(/s/i) !== null,
				hasSpecialization: token.token.includes("*"),
				upShift: tallyShifts(token.token, "up"),
				downShift: tallyShifts(token.token, "down")
			});
		}
	}
	if (token.key === "target") {
		core.target = parseTargetData(token);
		return core;
	}
	return baseReduceTokenToDicePartCore(core, token, index, tokens);
}
//#endregion

//#region Targets/Tests
enum TargetType { None = 0, DIF = 1 }
type TTargetData = { type:TargetType; value:number; hidden:boolean; raw:string; };
function parseTargetData(token: TokenData): OrUndefined<TTargetData> {
	if (token.matches) {
		const type = TargetType.DIF;
		const { value, hidden } = parseTestTargetValue(token.matches[1]);
		return { type, value, hidden, raw:token.token };
	}
	return undefined;
}
function targetDataToTestData(targetData: TTargetData): OrNull<TTestData> {
	return !targetData ? null : createValueTestData(TestType.GreaterThanOrEqual, targetData.value, targetData.hidden, "dif");
}
//#endregion

//#region helpers
export type TSkillDie = "fumble" | "fail" | "d20" | "d2" | "d4" | "d6" | "d8" | "d10" | "d12" | "2d8" | "3d6" | "success" | "critical";
/** return ["fumble","fail","d20","d2","d4","d6","d8","d10","d12","2d8","3d6","success","critical"]; */
function getLadder(startValue: TSkillDie = "fumble"): TSkillDie[] {
	const ladder: TSkillDie[] = ["fumble","fail","d20","d2","d4","d6","d8","d10","d12","2d8","3d6","success","critical"];
	const startIndex = ladder.indexOf(startValue);
	return ladder.slice(startIndex);
}

type TShiftArrow = "↑" | "↓" | "";
type TDieShift = {
	/** original die value */
	skillDie: TSkillDie;

	/** shifted die value */
	shiftedDie: TSkillDie;

	/** arrow representing shift direction as "↑" | "↓" | "" */
	shiftArrow: TShiftArrow;

	/** number of steps up (positive) or down (negative) the shiftedDie is from the skillDie */
	shiftNumber: number;

	/** is the value a flat d20 */
	d20: boolean;

	/** is the value "fumble" */
	fumble: boolean;

	/** is the value "fail" */
	fail: boolean;

	/** is the value "fail" or "fumble" */
	failOrFumble: boolean;

	/** is the value "success" */
	success: boolean;

	/** is the value "critical" */
	critical: boolean;

	/** is the value "success" or "critical" */
	successOrCritical: boolean;

	/** is the value NOT "fumble", "fail", "success", "critical" */
	rollable: boolean;

	/** descriptive text for shifted die */
	label: string;

	/** descriptive text for shifted die specialization */
	specLabel: string;

	/** number of dice to roll for a rollable value */
	count: number | undefined;

	/** number sides of the die for a rollable value */
	sides: number | undefined;
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

	const d20 = shiftedDie === "d20";

	const fail = shiftedDie === "fail";
	const fumble = shiftedDie === "fumble";
	const failOrFumble = fail || fumble;

	const success = shiftedDie === "success";
	const critical = shiftedDie === "critical";
	const successOrCritical = success || critical;

	const rollable = !failOrFumble && !successOrCritical;

	const plus = rollable && !d20 ? "+" : "";
	const label = rollable ? `${plus}${shiftedDie}${shiftArrow}`
		: fail ? "Auto Fail"
		: fumble ? "Fumble"
		: success ? "Auto Success"
		: "Critical Success";
	const specLabel = rollable ? `${label}*` : label;

	const [count, sides] = rollable ? shiftedDie.split("d").map(s => +s || undefined) : [];

	return {
		skillDie,
		shiftedDie,
		shiftArrow,
		shiftNumber,
		d20,
		fail,
		fumble,
		failOrFumble,
		success,
		critical,
		successOrCritical,
		rollable,
		label,
		specLabel,
		count,
		sides
	};
}
//#endregion

//#region DicePart
interface DicePartCore extends baseDicePartCore {
	downShift?: number;
	upShift?: number;
	specialization?: boolean;
	target?: TTargetData;
	/** ex: d4↑1 */
	shiftedDesc?: string;
	skillDie: TSkillDie;
}
type TDicePartCoreArgs = baseTDicePartCoreArgs & {
	downShift?: number;
	upShift?: number;
	specialization?: boolean;
	testOrTarget?: TTestData | TTargetData;
	/** ex: d4↑1 */
	shiftedDesc?: string;
	skillDie?: TSkillDie;
};
export class DicePart extends baseDicePart<DicePartCore, DicePartRoll> {
	public get shiftedDicePart(): DicePart | null {
		if (this.hasShift) {
			const { skillDie, shiftedDie, shiftArrow, shiftNumber, count, sides } = shiftDie(this.skillDie, [`+${this.upShift}`, `-${this.downShift}`]);
			const shiftedDesc = `${skillDie}${shiftArrow}${Math.abs(shiftNumber)}`;
			return DicePart.create({
				count,
				description: this.core.description,
				shiftedDesc,
				sides,
				sign: this.core.sign,
				skillDie: shiftedDie,
				specialization: this.core.specialization,
				testOrTarget: this.core.target ?? this.core.test,
				dropKeep: this.core.dropKeep
			});
		}
		return null;
	}
	//#region die shift non-rollable information
	public get skillDie(): TSkillDie {
		return this.core.skillDie;
	}
	public get isCriticalSuccess(): boolean { return this.skillDie === "critical"; }
	public get isAutoSuccess(): boolean { return this.skillDie === "success"; }
	public get isAutoFail(): boolean { return this.skillDie === "fail"; }
	public get isFumble(): boolean { return this.skillDie === "fumble"; }
	public get isRollable(): boolean { return !(this.isCriticalSuccess || this.isAutoSuccess || this.isAutoFail || this.isFumble); }
	public getNonRollableLabel(): string | null {
		if (!this.isRollable) {
			if (this.isCriticalSuccess) {
				return "Critical Success";
			}
			if (this.isAutoSuccess) {
				return "Auto Success";
			}
			if (this.isAutoFail) {
				return "Auto Fail";
			}
			if (this.isFumble) {
				return "Fumble";
			}
		}
		return null;
	}
	//#endregion

	/** Description of the original die if this was shifted. */
	public get shiftedDesc(): string | undefined { return this.core.shiftedDesc; }
	/** Was this die shifted or not. */
	public get wasShifted(): boolean { return this.core.shiftedDesc !== undefined; }
	public get hasShift(): boolean { return this.upShift + this.downShift !== 0; }
	public get upShift(): number { return this.core.upShift ?? 0; }
	public get downShift(): number { return this.core.downShift ?? 0; }
	public get hasSpecialization(): boolean { return this.core.specialization === true; }

	//#region static
	public static create({ count, description, dropKeep, sides, sign, specialization, testOrTarget, downShift, upShift, shiftedDesc, skillDie }: TDicePartCoreArgs = { }): DicePart {
		return new DicePart({
			objectType: "DicePart",
			gameType: GameSystemType.E20,
			id: randomSnowflake(),

			count: count ?? 1,
			description: cleanDescription(description),
			dropKeep: dropKeep ?? undefined,
			downShift: downShift ?? undefined,
			modifier: 0,
			noSort: false,
			shiftedDesc,
			sides: sides ?? 0,
			sign: sign,
			skillDie: skillDie ?? `${count ?? ""}d${sides ?? 20}`.replace(/^1d/, "d") as TSkillDie,
			specialization,
			test: targetDataToTestData(<TTargetData>testOrTarget) ?? <TTestData>testOrTarget ?? null,
			target: <TTargetData>testOrTarget ?? null,
			upShift: upShift ?? undefined
		});
	}
	public static fromCore(core: DicePartCore): DicePart {
		return new DicePart(core);
	}
	public static fromTokens(tokens: TokenData[]): DicePart {
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
				const upMatch = match(core, /^(↑|up)(\d*)/i);
				if (upMatch) {
					upShift += +upMatch[2];
					sliceLength = upMatch[0].length;
				}
				//#endregion
				//#region downShift
				const downMatch = match(core, /^(↓|dn)(\d*)/i);
				if (downMatch) {
					downShift += +downMatch[2];
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
		const dp = dicePart.shiftedDicePart ?? dicePart;
		const dpRolls = dp.isRollable ? rollDice(dp.count, dp.sides) : [];
		return new DicePartRoll({
			objectType: "DicePartRoll",
			gameType: GameSystemType.E20,
			id: randomSnowflake(),
			dice: dp.toJSON(),
			rolls: dpRolls
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
	//#region die shift non-rollable information
	public get isCriticalSuccess(): boolean { return this.diceParts.find(dicePart => dicePart.isCriticalSuccess) !== undefined; }
	public get isAutoSuccess(): boolean { return this.diceParts.find(dicePart => dicePart.isAutoSuccess) !== undefined; }
	public get isAutoFail(): boolean { return this.diceParts.find(dicePart => dicePart.isAutoFail) !== undefined; }
	public get isFumble(): boolean { return this.diceParts.find(dicePart => dicePart.isFumble) !== undefined; }
	public get isRollable(): boolean { return !(this.isCriticalSuccess || this.isAutoSuccess || this.isAutoFail || this.isFumble); }
	public getNonRollableLabel(): string | null { return this.diceParts.find(dicePart => !dicePart.isRollable)?.getNonRollableLabel() ?? null; }
	//#endregion

	//#region static
	public static create(diceParts: DicePart[]): Dice {
		return new Dice({
			objectType: "Dice",
			gameType: GameSystemType.E20,
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
	//#region static
	public static create(_dice: Dice): DiceRoll {
		return new DiceRoll({
			objectType: "DiceRoll",
			gameType: GameSystemType.E20,
			id: randomSnowflake(),
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
	//#region die shift non-rollable information
	public get isCriticalSuccess(): boolean { return this.dice.find(die => die.isCriticalSuccess) !== undefined; }
	public get isAutoSuccess(): boolean { return this.dice.find(die => die.isAutoSuccess) !== undefined; }
	public get isAutoFail(): boolean { return this.dice.find(die => die.isAutoFail) !== undefined; }
	public get isFumble(): boolean { return this.dice.find(die => die.isFumble) !== undefined; }
	public get isRollable(): boolean { return !(this.isCriticalSuccess || this.isAutoSuccess || this.isAutoFail || this.isFumble); }
	public getNonRollableLabel(): string | null { return this.dice.find(die => !die.isRollable)?.diceParts.find(dicePart => !dicePart.isRollable)?.getNonRollableLabel() ?? null; }
	//#endregion

	//#region static
	public static create(_dice: Dice[], diceOutputType?: DiceOutputType): DiceGroup {
		return new DiceGroup({
			objectType: "DiceGroup",
			gameType: GameSystemType.E20,
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
		let skillDicePart = DicePart.fromTokens(tokens);
		if (skillDicePart.hasShift) {
			skillDicePart = skillDicePart.shiftedDicePart!;
		}
		const skillDice = Dice.create([skillDicePart]);
		const dice = [skillDice];
		if (skillDicePart.sides !== 20 && skillDicePart.sign === "+") {
			const d20DicePartCore: DicePartCore = {
				objectType: "DicePart",
				gameType: GameSystemType.E20,
				id: randomSnowflake(),
				count: 1,
				sides: 20,
				description: "",
				modifier: 0,
				noSort: false,
				skillDie: "d20"
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

		if (skillDicePart.isRollable && skillDicePart.hasSpecialization) {
			const skillDie = skillDicePart.skillDie;
			const specializationLadder = getLadder("d2");
			if (specializationLadder.indexOf(skillDie) > 0) {
				for (let index = specializationLadder.indexOf(skillDie); index--;) {
					const stepSkillDie = specializationLadder[index];
					const [count, sides] = stepSkillDie.split("d");
					dice.push(Dice.create([new DicePart({
						objectType: "DicePart",
						gameType: GameSystemType.E20,
						id: randomSnowflake(),
						count: +count || 1,
						sides: +sides || 0,
						description: "",
						modifier: 0,
						noSort: false,
						skillDie: stepSkillDie
					})]));
				}
			}
		}
		return DiceGroup.create(dice, diceOutputType);
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
		const rollable = this.dice.isRollable;
		const d20Roll = this.rolls[0];
		const baseRoll: DiceRoll | undefined = this.rolls[1];
		const slicedRolls = this.rolls.slice(1);
		const highestRoll: DiceRoll | undefined = slicedRolls.reduce((highest, roll) => !highest || roll.total > highest.total ? roll : highest, undefined as DiceRoll | undefined);
		const maxRoll = slicedRolls.find(roll => (roll.dice.baseDicePart?.sides ?? 0) > 2 && roll.rolls.find(dpRoll => dpRoll.maxCount));

		const total = d20Roll.total + (highestRoll?.total ?? 0);

		const test = baseRoll?.dice.test ?? d20Roll.dice.test;
		const dif = test && rollable ? `DIF ${test.value}` : ``;

		let emoji = "";
		if (rollable) {
			if (test) {
				if (total >= test.value) {
					emoji = maxRoll ? "[critical-success]" : "[success]";
				}else {
					emoji = d20Roll.isMin ? "[critical-failure]" : "[failure]";
				}
			}else if (maxRoll) {
				emoji = "[critical-success]";
			}else if (d20Roll.isMin) {
				emoji = "[critical-failure]";
			}
		}else {
			if (this.dice.isCriticalSuccess) {
				emoji = "[critical-success]";
			}else if (this.dice.isAutoSuccess) {
				emoji = "[success]";
			}else if (this.dice.isAutoFail) {
				emoji = "[failure]";
			}else {
				emoji = "[critical-failure]";
			}
		}

		const parts = this.rolls.map((roll, index) => {
			const out = roll.toString(DiceOutputType.M).split(/⟵/)[1].split(/\bdif\b/)[0].trim();
			if (index && roll !== highestRoll) {
				return `<s>${out}</s>`;
			}
			return out;
		});

		const baseDescription = baseRoll?.dice.baseDicePart?.description ?? baseRoll?.dice.diceParts.find(dp => dp.description)?.description;
		const d20Description = d20Roll?.dice.baseDicePart?.description ?? d20Roll?.dice.diceParts.find(dp => dp.description)?.description;
		const description = baseDescription ?? d20Description;
		const desc = description ? correctEscapeForEmoji(`\`${description}\``) : "";
		const partsDesc = rollable ? `⟵ ${parts.join("; ")}` : ``;
		const nonRollableLabel = this.dice.getNonRollableLabel();
		return `${emoji} <b>${nonRollableLabel ?? total}</b> ${dif} ${desc} ${partsDesc}`.replace(/\s+/g, " ");
	}
	public static create(diceGroup: DiceGroup): DiceGroupRoll {
		return new DiceGroupRoll({
			objectType: "DiceGroupRoll",
			gameType: GameSystemType.E20,
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
