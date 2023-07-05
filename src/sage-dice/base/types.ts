import type { CritMethodType, DiceOutputType, DiceSecretMethodType, DieCore, TSign } from "..";
import { DiceDropKeepData } from "../common/DiceDropKeep";
import { DiceTestData } from "../common/DiceTest";
import type { Dice, DiceGroup, DiceGroupRoll, DicePart, DicePartRoll, DiceRoll } from "./dice";

//#region DicePart

interface DicePartCoreBase {

	/** number of dice */
	count: number;

	/** description of dice or modifier */
	description: string;

	/** drop/keep notation info */
	dropKeep?: DiceDropKeepData;

	/** roll modifier */
	modifier: number;

	/** no sort notation flag */
	noSort: boolean;

	/** number of sides on the dice */
	sides: number;

	/** sign (- or +) of the dice or modifier */
	sign?: TSign;

	/** target test information */
	test?: DiceTestData;
}

export type TDicePartCoreArgs = Partial<DicePartCoreBase>;

export interface DicePartCore extends DieCore<"DicePart">, DicePartCoreBase { }

export type TDicePart = DicePart<DicePartCore, TDicePartRoll>;

//#endregion

//#region DicePartRoll

export interface DicePartRollCore extends DieCore<"DicePartRoll"> {
	dice: DicePartCore;
	rolls: number[];
}

export type TDicePartRoll = DicePartRoll<DicePartRollCore, TDicePart>;

//#endregion

//#region Dice

export interface DiceCore extends DieCore<"Dice"> {
	diceParts: DicePartCore[];
}

export type TDice = Dice<DiceCore, TDicePart, TDiceRoll>;

//#endregion

//#region DiceRoll

export interface DiceRollCore extends DieCore<"DiceRoll"> {
	dice: DiceCore;
	rolls: DicePartRollCore[];
}

export type TDiceRoll = DiceRoll<DiceRollCore, TDice, TDicePartRoll>;

//#endregion

//#region DiceGroup

export interface DiceGroupCore extends DieCore<"DiceGroup"> {
	critMethodType?: CritMethodType;
	dice: DiceCore[];
	diceOutputType?: DiceOutputType;
	diceSecretMethodType?: DiceSecretMethodType;
}

export type TDiceGroup = DiceGroup<DiceGroupCore, TDice, TDiceGroupRoll>;

//#endregion

//#region DiceGroupRoll

export interface DiceGroupRollCore extends DieCore<"DiceGroupRoll"> {
	diceGroup: DiceGroupCore;
	rolls: DiceRollCore[];
}

export type TDiceGroupRoll = DiceGroupRoll<DiceGroupRollCore, TDiceGroup, TDiceRoll>;

//#endregion
