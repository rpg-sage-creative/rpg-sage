
export enum EmbedColorType {
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

export type EmbedColor = {
	type: EmbedColorType;
	hex: string;
	/** only used for dev purposes */
	label?: string;
}

export type HasEmbedColors = {
	colors: EmbedColor[];
}