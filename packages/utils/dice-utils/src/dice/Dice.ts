import { randomSnowflake } from "@rsc-utils/snowflake-utils";
import { cleanWhitespace, dequote } from "@rsc-utils/string-utils";
import { DiceTest } from "../DiceTest.js";
import { DieRollGrade, gradeRoll, gradeToEmoji } from "../grade.js";
import { detick } from "../internal/detick.js";
import { isBoolean } from "../internal/isBoolean.js";
import { isDiceOutputType } from "../internal/isDiceOutputType.js";
import { mapDicePartToRollString } from "../mapDicePartToRollString.js";
import { removeDesc } from "../removeDesc.js";
import { sum } from "../sum.js";
import { sumDiceParts } from "../sumDiceParts.js";
import { DiceOutputType } from "../types/DiceOutputType.js";
import { UNICODE_LEFT_ARROW } from "../types/consts.js";
import { DiceBase, type DiceBaseCore } from "./DiceBase.js";
import { DicePart, type DicePartCore, type TDicePart } from "./DicePart.js";

type DiceCoreBase = {
	children: DicePartCore[];
};

export type DiceCore<GameType extends number = number>
	= DiceCoreBase
	& DiceBaseCore<DicePartCore, "Dice", GameType>;

export type TDice = Dice<DiceCore, TDicePart>;

export class Dice<
			CoreType extends DiceCore<GameType>,
			ChildType extends TDicePart,
			GameType extends number = number
			> extends DiceBase<CoreType, ChildType, "Dice", GameType> {

	//#region calculated instance properties

	/** The first dicePart with a die, typically a d20. */
	public get primary(): ChildType | undefined { return this.children.find(dicePart => dicePart.hasDie); }

	/** Sums the max of all the dice parts. */
	public get max(): number { return sum(this.children.map(dicePart => dicePart.max)); }

	/** Sums the min of all the dice parts. */
	public get min(): number { return sum(this.children.map(dicePart => dicePart.min)); }

	/** Gets the first test. */
	public get test(): DiceTest { return this.children.find(dicePart => dicePart.hasTest)?.test ?? DiceTest.EmptyTest; }

	public get grade(): DieRollGrade { return (this.constructor as typeof Dice).gradeRoll(this); }

	public get total(): number { return sumDiceParts(this.children); }

	//#endregion

	//#region instance flags

	public get hasFixed(): boolean { return this.children.some(dicePart => dicePart.fixedRolls.length); }
	public get hasRolls(): boolean { return this.children.some(dicePart => dicePart.hasRolls); }
	public get isD20(): boolean { return this.primary?.sides === 20; }
	public get isEmpty(): boolean { return !this.children.some(dicePart => !dicePart.isEmpty); }
	public get isMax(): boolean { return this.total === this.max; }
	public get isMin(): boolean { return this.total === this.min; }

	//#endregion

	// public includes(childOrCore: TDicePart | DicePartCore): boolean {
	// 	return this.children.some(dicePart => dicePart.is(childOrCore));
	// }

	public toDiceString(_outputType?: DiceOutputType): string {
		const outputType = _outputType === DiceOutputType.S ? DiceOutputType.S : DiceOutputType.M;
		const output = this.children.map((dicePart, index) => dicePart.toDiceString(outputType, index)).join(" ");
		return cleanWhitespace(output);
	}

	//#region toRollString

	protected _toRollString(outputType: DiceOutputType, hideRolls: boolean): string {
		const xxs = this.toRollStringXXS(hideRolls);
		const desc = this.children.find(dicePart => dicePart.hasDescription)?.description;

		const isRollem = outputType === DiceOutputType.ROLLEM;
		const noDice = [DiceOutputType.L, DiceOutputType.S, DiceOutputType.XS, DiceOutputType.XXS].includes(outputType);
		const description = this.children.map((roll, index) => mapDicePartToRollString(roll, index, { hideRolls, isRollem, noDice })).join(" ");

		if (isRollem) {
			const stripped = xxs.replace(/<\/?(b|em|i|strong)>/ig, "").trim();
			const [_, emoji, total] = stripped.match(/^(?:(.*?)\s+)(\d+)$/) ?? ["","",stripped];
			const escapedTotal = `\` ${total} \``;

			const output = desc
				? `${emoji} '${detick(dequote(desc))}', ${escapedTotal} ${UNICODE_LEFT_ARROW} ${removeDesc(description, desc)}`
				: `${emoji} ${escapedTotal} ${UNICODE_LEFT_ARROW} ${description}`;
			return Dice.correctEscapeForEmoji(cleanWhitespace(output));
		}else {
			const output = desc
				? `${xxs} \`${detick(dequote(desc))}\` ${UNICODE_LEFT_ARROW} ${removeDesc(description, desc)}`
				: `${xxs} ${UNICODE_LEFT_ARROW} ${description}`;
			return Dice.correctEscapeForEmoji(cleanWhitespace(output));
		}
	}

	protected toRollStringXS(hideRolls: boolean): string {
		const xxs = this.toRollStringXXS(hideRolls);
		const desc = this.children.find(dicePart => dicePart.hasDescription)?.description;
		const output = desc
			? `${xxs} \`${detick(dequote(desc)) ?? ""}\``
			: xxs;
		return Dice.correctEscapeForEmoji(cleanWhitespace(output));
	}

	protected toRollStringXXS(hideRolls: boolean): string {
		const gradeEmoji = (this.constructor as typeof Dice).gradeToEmoji(this.grade, this.hasTest),
			outputEmoji = hideRolls ? ":question:" : gradeEmoji ?? "",
			fixedOutput = this.hasFixed ? "f" : "",
			totalString = `<i><b>${this.total}${fixedOutput}</b></i>`,
			totalOutput = hideRolls ? `||${totalString}||` : totalString,
			output = `${outputEmoji} ${totalOutput}`;
		return cleanWhitespace(output);
	}

	public toRollString(...args: (boolean | DiceOutputType)[]): string {
		const hideRolls = args.find(isBoolean) ?? false;
		const outputType = args.find(isDiceOutputType) ?? DiceOutputType.M;
		if (outputType === DiceOutputType.XXS) {
			return this.toRollStringXXS(hideRolls);
		}
		if (outputType === DiceOutputType.XS) {
			return this.toRollStringXS(hideRolls);
		}
		return this._toRollString(outputType, hideRolls);
	}

	//#endregion

	//#region static

	public static create<DiceType extends TDice, DicePartType extends TDicePart>(diceParts: DicePartType[]): DiceType {
		return new this({
			objectType: "Dice",
			gameType: this.GameType,
			id: randomSnowflake(),
			children: diceParts.map(dicePart => dicePart.toJSON())
		}) as DiceType;
	}

	public static fromCore<CoreType extends DiceCore, DiceType extends TDice>(core: CoreType): DiceType {
		return new this(core as DiceCore) as DiceType;
	}

	public static readonly Child = DicePart as typeof DiceBase;

	public static readonly correctEscapeForEmoji: (diceOutput: string) => string = (diceOutput: string) => diceOutput;

	public static readonly gradeRoll = gradeRoll;

	public static readonly gradeToEmoji = gradeToEmoji;

	//#endregion
}