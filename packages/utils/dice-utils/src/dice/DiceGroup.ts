import { isGradeFailure } from "../grade.js";
import { isBoolean } from "../internal/isBoolean.js";
import { isDiceOutputType } from "../internal/isDiceOutputType.js";
import { tokenize, type TokenData } from "../internal/tokenize.js";
import { randomSnowflake } from "../random/randomSnowflake.js";
import { getDiceTokenParsers } from "../token/getDiceTokenParsers.js";
import { partitionDicePartTokens } from "../token/partitionDicePartTokens.js";
import { partitionDiceParts } from "../token/partitionDiceParts.js";
import { DiceCriticalMethodType } from "../types/DiceCriticalMethodType.js";
import { DiceOutputType } from "../types/DiceOutputType.js";
import { DiceSecretMethodType } from "../types/DiceSecretMethodType.js";
import { Dice, type DiceCore, type TDice } from "./Dice.js";
import { DiceBase, type DiceBaseCore } from "./DiceBase.js";
import type { TDicePart } from "./DicePart.js";

type DiceGroupCoreBase = {
	criticalMethodType?: DiceCriticalMethodType;
	outputType?: DiceOutputType;
	secretMethodType?: DiceSecretMethodType;
};

export type DiceGroupCoreArgs = Partial<DiceGroupCoreBase>;

export type DiceGroupCore<GameType extends number = number>
	= DiceGroupCoreBase
	& DiceBaseCore<DiceCore, "DiceGroup", GameType>;

export type TDiceGroup = DiceGroup<DiceGroupCore, TDice>;

export class DiceGroup<
			CoreType extends DiceGroupCore<GameType>,
			ChildType extends TDice,
			GameType extends number = number
			> extends DiceBase<CoreType, ChildType, "DiceGroup", GameType> {


	public get criticalMethodType(): DiceCriticalMethodType | undefined { return this.core.criticalMethodType; }

	public get outputType(): DiceOutputType | undefined { return this.core.outputType; }

	public get primary(): ChildType | undefined { return this.children.find(child => child.primary); }

	public get secretMethodType(): DiceSecretMethodType | undefined { return this.core.secretMethodType; }

	public toDiceString(outputType?: DiceOutputType): string {
		return `[${this.children.map(dice => dice.toDiceString(outputType)).join("; ")}]`;
	}

	public toRollString(...args: (boolean | DiceOutputType)[]): string {
		const hideRolls = args.find(isBoolean) ?? false;
		const outputType = this.outputType ?? args.find(isDiceOutputType) ?? DiceOutputType.M;
		const joiner = outputType < DiceOutputType.L ? "; " : "\n";
		const output: string[] = [];
		for (const dice of this.children) {
			output.push(dice.toRollString(outputType, hideRolls));
			const grade = dice.grade;
			if (isGradeFailure(grade)) {
				// if there are multiple tests, we should start at the first failure ... right?
				break;
			}
		}
		return output.join(joiner);
	}

	//#region static

	public static create<DiceGroupType extends TDiceGroup, DiceType extends TDice>(dice: DiceType[], args: DiceGroupCoreArgs = {}): DiceGroupType {
		return new this({
			objectType: "DiceGroup",
			gameType: this.GameType,
			id: randomSnowflake(),

			children: dice.map(_dice => _dice.toJSON()),
			criticalMethodType: args.criticalMethodType,
			outputType: args.outputType,
			secretMethodType: args.secretMethodType
		}) as DiceGroupType;
	}

	public static fromCore<CoreType extends DiceGroupCore, DiceGroupType extends TDiceGroup>(core: CoreType): DiceGroupType {
		return new this(core as DiceGroupCore) as DiceGroupType;
	}

	public static parse<DiceType extends TDiceGroup>(diceString: string, args?: DiceGroupCoreArgs): DiceType {
		const tokens = tokenize(diceString, this.getTokenParsers(), "desc");
		return this.fromTokens(tokens, args);
	}

	public static fromTokens<DiceGroupType extends TDiceGroup>(tokens: TokenData[], args?: DiceGroupCoreArgs): DiceGroupType {
		const partedTokens = this.partitionDicePartTokens(tokens);
		const diceParts = partedTokens.map(tokens => this.Child.Child.fromTokens(tokens) as TDicePart);
		const partedDiceParts = this.partitionDiceParts(diceParts);
		const dice = partedDiceParts.map(diceCore => this.Child.create(diceCore) as TDice);
		return this.create(dice, args);
	}

	public static readonly getTokenParsers = getDiceTokenParsers;

	public static readonly partitionDicePartTokens = partitionDicePartTokens;

	public static readonly partitionDiceParts = partitionDiceParts;

	public static readonly Child = Dice as typeof DiceBase;

	//#endregion
}
