import { randomSnowflake } from "@rsc-utils/core-utils";
import { DiceTest, type DiceTestData, type DiceTestType } from "../DiceTest.js";
import { cleanDicePartDescription } from "../cleanDicePartDescription.js";
import { hasSecretFlag } from "../internal/hasSecretFlag.js";
import type { TokenData } from "../internal/tokenize.js";
import { DiceDropKeep } from "../manipulate/DiceDropKeep.js";
import { DiceExplode } from "../manipulate/DiceExplode.js";
import type { DiceManipulationData } from "../manipulate/DiceManipulationData.js";
import { DiceThreshold } from "../manipulate/DiceThreshold.js";
import { rollDicePart } from "../roll/rollDicePart.js";
import { reduceTokenToDicePartCore } from "../token/reduceTokenToDicePartCore.js";
import type { DiceOperator } from "../types/DiceOperator.js";
import { DiceOutputType } from "../types/DiceOutputType.js";
import type { RollData } from "../types/RollData.js";
import type { SortedRollData } from "../types/SortedDataRoll.js";
import { DiceBase, type DiceBaseCore } from "./DiceBase.js";

type DicePartCoreBase<TargetType extends number = DiceTestType> = {

	/** number of dice */
	count?: number;

	/** description of dice or modifier */
	description: string;

	/** values to use instead of rolling */
	fixedRolls?: number[];

	/** do we have: dropKeep, explode, threshold ? ? ? */
	manipulation?: DiceManipulationData[];

	/** roll modifier */
	modifier?: number;

	/** number of sides on the dice */
	sides?: number;

	/** sign (- or +) of the dice or modifier */
	sign?: DiceOperator;

	sortedRollData?: SortedRollData;

	/** a target value test parsed generically */
	test?: DiceTestData;

	/** a target value data specific to the game system */
	target?: DiceTestData<TargetType>;
};

export type DicePartCoreArgs = Partial<DicePartCoreBase<number>>;

export type DicePartCore<TargetType extends number = number, GameType extends number = number>
	= DicePartCoreBase<TargetType>
	& DiceBaseCore<never, "DicePart", GameType>;

export type TDicePart = DicePart<DicePartCore>;

export class DicePart<
			CoreType extends DicePartCore<TargetType, GameType>,
			TargetType extends number = number,
			GameType extends number = number
			>extends DiceBase<CoreType, never, "DicePart", GameType> {


	public constructor(core: CoreType) {
		super(core);
		core.manipulation?.forEach(m => {
			if (m.dropKeep) {
				m.dropKeep = new DiceDropKeep(m.dropKeep);
			}else if (m.explode) {
				m.explode = new DiceExplode(m.explode);
			}else if (m.threshold) {
				m.threshold = new DiceThreshold(m.threshold);
			}
		});
	}

	//#region from this.core

	public get count(): number { return this.core.count ?? 0; }

	public get description(): string { return this.core.description ?? ""; }

	public get fixedRolls(): number[] { return this.core.fixedRolls ?? []; }

	public get manipulation(): DiceManipulationData[] { return this.core.manipulation ?? []; }

	public get modifier(): number { return this.core.modifier ?? 0; }

	public get sides(): number { return this.core.sides ?? 0; }

	public get sign(): DiceOperator | undefined { return this.core.sign; }

	public get sortedRollData(): SortedRollData | undefined { return this.core.sortedRollData; };

	private _test?: DiceTest;
	public get test(): DiceTest { return this._test ?? (this._test = new DiceTest(this.core.test)); }

	//#endregion

	//#region flags

	/** true if the description has length > 0 */
	public get hasDescription(): boolean { return this.description.length > 0; }
	/** true if count > 0 and sides is > 0 */
	public get hasDie(): boolean { return this.count > 0 && this.sides > 0; }
	/** has some form of manipulation, ex: dropkeep */
	public get hasManipulation(): boolean { return this.manipulation.length > 0; }
	/** true if this dicepart has a modifier, even if that modifier is +/- 0 */
	public get hasModifier(): boolean { return this.core.modifier !== undefined; }
	/** has roll data */
	public get hasRolls(): boolean { return !!this.sortedRollData; }
	/** is marked as secret */
	public get hasSecret(): boolean { return hasSecretFlag(this.description); }
	/** has a test */
	public get hasTest(): boolean { return !this.test.isEmpty; }
	/** true if this.hasDie || this.hasModifier */
	public get hasValue(): boolean { return this.hasDie || this.hasModifier; }
	/** count and sides and modifier are all 0 */
	public get isEmpty(): boolean { return this.count === 0 && this.sides === 0 && this.modifier === 0; }
	/** is this roll max, ex: 6 on 1d6 */
	public get isMax(): boolean { return this.total === this.max; }
	/** is this roll min, ex: 1 on 1d6 */
	public get isMin(): boolean { return this.total === this.min; }

	//#endregion

	//#region roll

	//#region helpers

	/** The biggest possible result. Simply totals max roll + modifier. */
	private get biggest(): number { return (this.hasRolls ? this.rollCount : this.count) * this.sides + this.modifier; }

	/** The smallest possible result. Simply totals min roll + modifier. */
	private get smallest(): number { return (this.hasRolls ? this.rollCount : this.count) + this.modifier; }

	//#endregion

	/** The maximum possible result. Accounts for negative numbers, thus -1d6 has max of -1 and min of -6. */
	public get max(): number { return this.sign === "-" ? -1 * this.smallest : this.biggest; }

	/** How many dice rolled max (value equal to .dice.sides). */
	public get maxCount(): number { return this.rollsByIndex.filter(roll => !roll.isDropped && roll.isMax).length; }

	/** The minimum possible result. Accounts for negative numbers, thus -1d6 has max of -1 and min of -6. */
	public get min(): number { return this.sign === "-" ? -1 * this.biggest : this.smallest; }

	/** How many dice rolled 1. */
	public get minCount(): number { return this.rollsByIndex.filter(roll => !roll.isDropped && roll.isMin).length; }

	public get rollCount(): number { return this.sortedRollData?.count ?? 0; }

	public get rollSum(): number { return this.sortedRollData?.sum ?? 0; }

	public get rollsByIndex(): RollData[] { return this.sortedRollData?.byIndex ?? []; }

	public get rollsByValue(): RollData[] { return this.sortedRollData?.byValue ?? []; }

	public get total(): number {
		const mod = this.modifier;
		const rollSum = this.rollSum;
		const mult = this.sign === "-" ? -1 : 1;
		return mult * (mod + rollSum);
	}

	public roll(): this {
		if (!this.isEmpty || !this.hasRolls) {
			this.core.sortedRollData = rollDicePart(this);
		}
		return this;
	}

	//#endregion

	public toDiceString(outputType?: DiceOutputType, index?: number): string {
		const fixed = this.fixedRolls.length ? `(${this.fixedRolls})` : ``;
		const die = this.hasDie ? `${fixed}${this.count}d${this.sides}` : ``;
		const manipulation = this.toManipulationString(" ");
		const mod = this.modifier ? ` ${this.modifier}` : ``;
		const valueTest = this.test.toString();
		const withoutDescription = die + manipulation + mod + valueTest;
		if (outputType === DiceOutputType.S) {
			return withoutDescription;
		}
		const sign = index && this.hasValue ? `${this.sign ?? "+"}` : ``;
		return `${sign} ${withoutDescription} ${this.description}`.trim();
	}

	protected toManipulationString(leftPad?: string, rightPad?: string): string {
		return this.manipulation?.map(m => {
			return m.dropKeep?.toString(leftPad, rightPad)
				?? m.explode?.toString(leftPad, rightPad)
				?? m.threshold?.toString(leftPad, rightPad);
		})
		.filter(s => s?.length)
		.join("")
		?? "";
	}

	public toRollString(): string { return ""; }

	//#region static

	public static create<DicePartType extends TDicePart>(args: DicePartCoreArgs = {}): DicePartType {
		return this.fromCore({
			objectType: "DicePart",
			gameType: this.GameType,
			id: randomSnowflake(),

			children: undefined!,
			count: args.count ?? 0,
			description: cleanDicePartDescription(args.description),
			fixedRolls: args.fixedRolls,
			manipulation: args.manipulation,
			modifier: args.modifier ?? 0,
			sides: args.sides ?? 0,
			sign: args.sign,
			sortedRollData: args.sortedRollData,
			target: args.target,
			test: this.targetDataToTestData(args.target) ?? args.test,
		});
	}

	public static fromCore<CoreType extends DicePartCore, DicePartType extends TDicePart>(core: CoreType): DicePartType {
		return new this(core as DicePartCore) as DicePartType;
	}

	public static fromTokens<DicePartType extends TDicePart>(tokens: TokenData[]): DicePartType {
		const core = tokens.reduce(this.reduceTokenToCore, { description:"" } as DicePartCore);
		return this.create(core);
	}

	public static readonly reduceTokenToCore = reduceTokenToDicePartCore;

	public static readonly targetDataToTestData: (targetData?: DiceTestData<number>) => DiceTestData | undefined = () => undefined;

	//#endregion
}
