import { cleanWhitespace, getCodeName, randomSnowflake, tokenize, type OrNull, type TokenData, type TokenParsers } from "@rsc-utils/core-utils";
import { rollDice } from "@rsc-utils/dice-utils";
import { DiceOutputType, GameSystemType } from "@rsc-utils/game-utils";
import {
	DiceSecretMethodType,
	TestType, UNICODE_LEFT_ARROW,
	cleanDescription,
	parseTestTargetValue,
	type TDiceLiteral,
	type TTestData
} from "../../common.js";
import {
	Dice as baseDice, DiceGroup as baseDiceGroup,
	DiceGroupRoll as baseDiceGroupRoll, DicePart as baseDicePart,
	DicePartRoll as baseDicePartRoll, DiceRoll as baseDiceRoll
} from "../base/index.js";
import type {
	DiceCore as baseDiceCore, DiceGroupCore as baseDiceGroupCore,
	DiceGroupRollCore as baseDiceGroupRollCore, DicePartCore as baseDicePartCore,
	DicePartRollCore as baseDicePartRollCore, DiceRollCore as baseDiceRollCore, TDicePartCoreArgs as baseTDicePartCoreArgs
} from "../base/types.js";

/*

no default target ("VS")

roll Xd10

for each die:
  1-5: failure
  6-9: +1 success
   10: success, potential crit

for each hunger die:
    1: bestial failure
  2-5: failure
  6-9: +1 success
   10: success, potential messy crit

hunger takes priority in critical pairings ...

*/

//#region Tokenizer

function getParsers(): TokenParsers {
	return {
		dice: /(\d+)?\s*d\s*10\s*(?:h\s*(\d+)|(\d+)\s*h)?/i,
		target: /(vs)\s*(\d+|\|\|\d+\|\|)/i
	};
}

type TokenType = TokenData<"dice" | "target" | "desc">;

function reduceTokenToDicePartCore<T extends DicePartCore>(core: T, token: TokenData<any>): T;
function reduceTokenToDicePartCore<T extends DicePartCore>(core: T, token: TokenType): T {
	if (token.key === "dice") {
		core.count = +token.matches[0];
		core.sides = 10;
		if (token.matches[1] || token.matches[2]) {
			core.hunger = +(token.matches[1] ?? token.matches[2]);
		}

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
	return !targetData ? null : { alias:"vs", type: TestType.GreaterThanOrEqual, value:targetData.value, hidden:targetData.hidden };
}

//#endregion

//#region Grades

type DieGradeType =
	/** Bestial Failure: 1 (hunger) */
	| "B"
	/** Failure: 1-5 (base) or 2-5 (hunger) */
	| "F"
	/** Success: 6-9 */
	| "S"
	/** Potential Crit Success: 10 (base) */
	| "C"
	/** Potential Messy Success: 10 (hunger) */
	| "M";

type DieGradeResult = {
	emoji: string;
	grade: DieGradeType;
	hunger: boolean;
	success: boolean;
	value: number;
};

function _gradeDie(value: number, hunger: boolean, success: boolean, grade: DieGradeType): DieGradeResult {
	const emoji = toEmoji({ hunger, grade });
	return { emoji, grade, hunger, success, value };
}

function gradeDie(value: number, hunger: boolean): DieGradeResult {
	if (value === 10) {
		return _gradeDie(value, hunger, true, hunger ? "M" : "C");
	}else if (value > 5) {
		return _gradeDie(value, hunger, true, "S");
	}else if (value > 1) {
		return _gradeDie(value, hunger, false, "F");
	}else {
		return _gradeDie(value, hunger, false, hunger ? "B" : "F");
	}
}

type RollGradeType = DieGradeType | "";

type RollGradeResult = {
	allResults: DieGradeResult[];
	baseResults: DieGradeResult[];
	bestial: boolean;
	critical: boolean;
	failures: number;
	grade: RollGradeType;
	hungerResults: DieGradeResult[];
	messy: boolean;
	successes: number;
	vs?: number;
}

function gradeRoll(rolls: number[], hunger: number, vs?: number): RollGradeResult {
	const baseValues = rolls.slice();
	const hungerValues = baseValues.splice(0, hunger);

	const baseResults = baseValues.map(value => gradeDie(value, false));
	const hungerResults = hungerValues.map(value => gradeDie(value, true));
	const allResults = baseResults.concat(hungerResults).sort(sortGrade);

	const baseSuccesses = allResults.filter(result => result.success).length;
	const criticalBonusSuccesses = Math.floor(allResults.filter(result => ["C","M"].includes(result.grade as string)).length / 2) * 2;
	const successes = baseSuccesses + criticalBonusSuccesses;
	const failures = allResults.filter(result => !result.success).length;

	const criticalCount = baseResults.filter(result => result.grade === "C").length;
	const messyCount = hungerResults.filter(result => result.grade === "M").length;
	const critical = criticalCount + messyCount > 1;
	const messy = critical && messyCount > 0;
	const bestial = hungerResults.filter(result => result.grade === "B").length > 0;

	let grade: RollGradeType = "";
	if (vs) {
		if (successes >= vs) {
			grade = messy ? "M" : critical ? "C" : "S";
		}else {
			grade = messy ? "B" : "F";
		}
	}

	return { allResults, baseResults, bestial, critical, failures, grade, hungerResults, messy, successes, vs };
}

type HungerAndGrade = { hunger:boolean; grade:DieGradeType; };

/** @todo rework the bot config file to includde bot emoji ... or perhaps have a separate config file *just* for emoji. */
function getEmoji() {
	switch(getCodeName()) {
		case "stable":
			return {
				HB: "<:vtm5_hunger_bestial:1283542785919811719>",
				HF: "<:vtm5_hunger_failure:1283542802369613895>",
				HS: "<:vtm5_hunger_success:1283542840768598056>",
				HM: "<:vtm5_hunger_messy:1283542823768948849>",
				F: "<:vtm5_failure:1283542767833714740>",
				S: "<:vtm5_success:1283542855922614343>",
				C: "<:vtm5_critical:1283542746040111136>"
			};
		case "beta":
			return {
				HB: "<:vtm5_hunger_bestial:1283543179731402853>",
				HF: "<:vtm5_hunger_failure:1283543193291456597>",
				HS: "<:vtm5_hunger_success:1283543223750361220>",
				HM: "<:vtm5_hunger_messy:1283543208613253180>",
				F: "<:vtm5_failure:1283543162995998732>",
				S: "<:vtm5_success:1283543239734857811>",
				C: "<:vtm5_critical:1283543135523180615>"
			};
		case "dev":
		default:
			return {
				HB: "<:vtm5_hunger_bestial:1283543338238349363>",
				HF: "<:vtm5_hunger_failure:1283543347725733991>",
				HS: "<:vtm5_hunger_success:1283543378306400356>",
				HM: "<:vtm5_hunger_messy:1283543361797755045>",
				F: "<:vtm5_failure:1283543328763150379>",
				S: "<:vtm5_success:1283543387001196618>",
				C: "<:vtm5_critical:1283543316184567840>"
			};
	}
}

function toEmoji(result: HungerAndGrade): string {
	const emoji = getEmoji();
	if (result.hunger) {
		switch(result.grade) {
			case "B": return emoji.HB;
			case "F": return emoji.HF;
			case "S": return emoji.HS;
			case "M": return emoji.HM;
			default: return `*${result.grade}*`;
		}
	}
	switch(result.grade) {
		case "F": return emoji.F;
		case "S": return emoji.S;
		case "C": return emoji.C;
		default: return result.grade as string;
	}
}

function sortGrade(a: DieGradeResult, b: DieGradeResult): -1 | 0 | 1 {
	if (a.grade !== b.grade || a.hunger !== b.hunger) {
		if (a.grade === "F" && b.grade === "F") return a.hunger ? -1 : 1;
		const order = ["B", "F", "S", "C", "M"] as DieGradeType[];
		const aIndex = order.indexOf(a.grade);
		const bIndex = order.indexOf(b.grade);
		return aIndex < bIndex ? -1 : 1;
	}
	return 0;
}

function rollGradeToEmoji(gradeResults: RollGradeResult): string {
	const grade = gradeResults.grade as DieGradeType;
	const hunger = gradeResults.hungerResults.find(result => result.grade === grade)?.hunger ?? false;
	return toEmoji({ grade, hunger });
}

function gradeToEmoji(gradeResults: RollGradeResult): string {
	if (gradeResults.grade) {
		return rollGradeToEmoji(gradeResults);
	}
	if (gradeResults.allResults.length > 10) {
		return gradeResults.allResults.map(result => result.emoji).reduce((array, emoji) => {
			const entry = array.find(entry => entry.emoji === emoji);
			if (entry) {
				entry.count++;
			}else {
				array.push({ emoji, count:1 });
			}
			return array;
		}, [] as { emoji:string; count:number; }[])
			.map(entry => `${entry.count}x${entry.emoji}`)
			.join(" ");
	}
	return gradeResults.allResults.map(result => result.emoji).join("");
}

//#endregion

//#region toString

function toStringXXS(gradeResults: RollGradeResult): string {
	return gradeResults.grade
		? rollGradeToEmoji(gradeResults)
		: String(gradeResults.successes);
}

function toStringXS(gradeResults: RollGradeResult): string {
	return gradeResults.grade
		? `${rollGradeToEmoji(gradeResults)} (${gradeResults.successes})`
		: String(gradeResults.successes);
}

function toStringS(gradeResults: RollGradeResult, desc?: string): string {
	const descOutput = desc ? "`" + desc + "`" : "";
	return gradeResults.grade
		? `${rollGradeToEmoji(gradeResults)} (${gradeResults.successes}) ${descOutput}`
		: `${gradeResults.successes} ${descOutput}`;
}

function toStringM(gradeResults: RollGradeResult, desc?: string): string {
	const descOutput = desc ? "`" + desc + "`" : "";
	const baseOutput = ` ${gradeResults.allResults.length}d10`;
	const hungerOutput = gradeResults.hungerResults.length ? `h${gradeResults.hungerResults.length}` : ``;
	const vsOutput = gradeResults.vs ? ` vs ${gradeResults.vs} ` : ``;
	return gradeResults.grade
		? `${rollGradeToEmoji(gradeResults)} (${gradeResults.successes}) ${descOutput} ${UNICODE_LEFT_ARROW} ${baseOutput} ${hungerOutput} ${vsOutput}`
		: `${gradeResults.successes} ${descOutput} ${UNICODE_LEFT_ARROW} ${baseOutput} ${hungerOutput} ${vsOutput}`;
}

function toStringL(gradeResults: RollGradeResult, desc?: string): string {
	const gradeOutput = gradeToEmoji(gradeResults);
	const successesOutput = ` (${gradeResults.successes})`;
	const descOutput = desc ? "`" + desc + "`" : "";
	const baseOutput = gradeResults.baseResults.length ? ` ${gradeResults.baseResults.length}d10` : ``;
	const plusOutput = gradeResults.baseResults.length && gradeResults.hungerResults.length ? ` + ` : ``;
	const hungerOutput = gradeResults.hungerResults.length ? ` ${gradeResults.hungerResults.length}d10h` : ``;
	const vsOutput = gradeResults.vs ? ` vs ${gradeResults.vs} ` : ``;
	return cleanWhitespace(`${gradeOutput} ${successesOutput} ${descOutput} ${UNICODE_LEFT_ARROW} ${baseOutput} ${plusOutput} ${hungerOutput} ${vsOutput}`);
}

function toStringXL(gradeResults: RollGradeResult, desc?: string): string {
	const gradeOutput = gradeToEmoji(gradeResults);
	const successesOutput = ` (${gradeResults.successes})`;
	const descOutput = desc ? "`" + desc + "`" : "";
	const baseOutput = gradeResults.baseResults.length ? ` [${gradeResults.baseResults.map(r => r.emoji).join("")}]${gradeResults.baseResults.length}d10` : ``;
	const hungerOutput = gradeResults.hungerResults.length ? ` [${gradeResults.hungerResults.map(r => r.emoji).join("")}]${gradeResults.hungerResults.length}d10h` : ``;
	const plusOutput = gradeResults.baseResults.length && gradeResults.hungerResults.length ? ` + ` : ``;
	const vsOutput = gradeResults.vs ? ` vs ${gradeResults.vs} ` : ``;
	return cleanWhitespace(`${gradeOutput} ${successesOutput} ${descOutput} ${UNICODE_LEFT_ARROW} ${baseOutput} ${plusOutput} ${hungerOutput} ${vsOutput}`);
}
function toStringXXL(gradeResults: RollGradeResult, desc?: string): string {
	return toStringXL(gradeResults, desc);
}

function toString(diceRoll: DiceRoll, size?: DiceOutputType): string {
	const rolls = diceRoll.rolls[0].rolls;
	const hunger = diceRoll.hunger ?? 0;
	const vs = diceRoll.dice.test?.value;
	const gradeResults = gradeRoll(rolls, hunger, vs);
	const desc = diceRoll.dice.diceParts.find(dp => dp.hasDescription)?.description;

	switch(size) {
		case DiceOutputType.XXS: return toStringXXS(gradeResults);
		case DiceOutputType.XS: return toStringXS(gradeResults);
		case DiceOutputType.S: return toStringS(gradeResults, desc);
		case DiceOutputType.M: return toStringM(gradeResults, desc);
		case DiceOutputType.L: return toStringL(gradeResults, desc);
		case DiceOutputType.XL: return toStringXL(gradeResults, desc);
		default: return toStringXXL(gradeResults, desc);
	}
}

//#endregion

//#region DicePart

interface DicePartCore extends baseDicePartCore {
	hunger?: number;
	target?: TTargetData;
}

type TDicePartCoreArgs = baseTDicePartCoreArgs & {
	hunger?: number;
	testOrTarget?: TTestData | TTargetData;
};

export class DicePart extends baseDicePart<DicePartCore, DicePartRoll> {
	public get hasHunger(): boolean { return (this.core.hunger ?? 0) > 0; }
	public get hunger(): number | undefined { return this.core.hunger; }
	public toString(index?: number, outputType?: DiceOutputType): string {
		const die = this.count && this.sides ? `${this.count}d${this.sides}` : ``,
			hunger = this.hasHunger ? ` h${this.hunger}` : ``,
			valueTest = this.hasTest ? ` ${this.test!.alias} ${this.test!.value}` : ``,
			withoutDescription = die + hunger + valueTest;
		if (outputType === DiceOutputType.S) {
			return withoutDescription;
		}
		const sign = index && !this.isEmpty ? `${this.sign || "+"}` : ``;
		return `${sign} ${withoutDescription} ${this.description}`.trim();
	}
	//#region static
	public static create({ count, description, hunger, testOrTarget }: TDicePartCoreArgs = {}): DicePart {
		return new DicePart({
			objectType: "DicePart",
			gameType: GameSystemType.VtM5e,
			id: randomSnowflake(),

			count: count ?? 1,
			description: cleanDescription(description),
			dropKeep: undefined,
			hunger: hunger,
			modifier: 0,
			noSort: false,
			sides: 10,
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
	public get hasHunger(): boolean { return (this.dice.hunger ?? 0) > 0; }
	public get hunger(): number | undefined { return this.dice.hunger; }
	//#region static
	public static create(dicePart: DicePart): DicePartRoll {
		return new DicePartRoll({
			objectType: "DicePartRoll",
			gameType: GameSystemType.VtM5e,
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
	public get hasHunger(): boolean { return this.diceParts.find(dp => dp.hasHunger) !== undefined; }
	public get hunger(): number | undefined { return this.diceParts.find(dp => dp.hasHunger)?.hunger; }
	public get isD10(): boolean { return this.baseDicePart?.sides === 10; }
	//#region static
	public static create(diceParts: DicePart[]): Dice {
		return new Dice({
			objectType: "Dice",
			gameType: GameSystemType.VtM5e,
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
	public get hasHunger(): boolean { return this.dice.hasHunger; }
	public get hunger(): number | undefined { return this.dice.hunger; }

	//#region static
	public static create(_dice: Dice): DiceRoll {
		return new DiceRoll({
			objectType: "DiceRoll",
			gameType: GameSystemType.VtM5e,
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
	//#region static
	public static create(_dice: Dice[], diceOutputType?: DiceOutputType): DiceGroup {
		return new DiceGroup({
			objectType: "DiceGroup",
			gameType: GameSystemType.VtM5e,
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
	public toString(): string {
		return this.rolls[0].dice.isD10
			? toString(this.rolls[0], this.dice.diceOutputType)
			: super.toString();
	}
	public static create(diceGroup: DiceGroup): DiceGroupRoll {
		return new DiceGroupRoll({
			objectType: "DiceGroupRoll",
			gameType: GameSystemType.VtM5e,
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
