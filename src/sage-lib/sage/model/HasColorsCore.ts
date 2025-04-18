import type { HexColorString } from "@rsc-utils/core-utils";
import type { Colors } from "./Colors.js";

export enum ColorType {
	Command = 1,

	AdminCommand = 2,

	Search = 3,
	SearchFind = 31,

	Dice = 4,

	Dialog = 5,
	GameMaster = 51,
	NonPlayerCharacter = 52,
	NonPlayerCharacterAlly = 521,
	NonPlayerCharacterEnemy = 522,
	NonPlayerCharacterBoss = 523,
	NonPlayerCharacterMinion = 524,
	PlayerCharacter = 53,
	PlayerCharacterAlt = 531,
	PlayerCharacterCompanion = 532,
	PlayerCharacterFamiliar = 533,
	PlayerCharacterHireling = 534,

	PfsCommand = 6
}

export interface IColor {
	type: ColorType;
	hex: string;
	/** only used for dev purposes */
	label?: string;
}
export interface IHasColors {
	colors: IColor[];
}
export interface IHasColorsCore {
	colors: Colors;
	toHexColorString(colorType: ColorType): HexColorString | undefined;
}
