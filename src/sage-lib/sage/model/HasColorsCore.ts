import type Colors from "./Colors";

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
	PlayerCharacter = 53,
	PlayerCharacterAlt = 531,
	PlayerCharacterCompanion = 532,
	PlayerCharacterHireling = 533,

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
	toDiscordColor(colorType: ColorType): string | null;
}
