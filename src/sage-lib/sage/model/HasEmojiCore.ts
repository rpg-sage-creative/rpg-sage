import type { Emoji } from "./Emoji.js";

export enum EmojiType {

	// Command = 1,
	CommandSuccess = 11,
	CommandFailure = 12,
	CommandWarn = 13,
	CommandError = 14,
	CommandDelete = 15,
	CommandPin = 16,
	CommandLookup = 17,

	// Permission = 2
	PermissionDenied = 21,
	PermissionPatreon = 22,

	// Actions = 3
	ActionsOne = 31,
	ActionsTwo = 32,
	ActionsThree = 33,
	ActionsReaction = 34,
	ActionsFree = 35,
	ActionsOne2 = 321,
	ActionsTwo2 = 322,
	ActionsThree2 = 323,
	ActionsReaction2 = 324,
	ActionsFree2 = 325,

	// Dice
	Die = 4,
	DieCriticalSuccess = 41,
	DieSuccess = 42,
	DieFailure = 43,
	DieCriticalFailure = 44,
	DieDamage = 45,
	DieTestConcealed = 461,
	DieTestConcealedSuccess = 4611,
	DieTestConcealedFailure = 4612,
	DieTestHidden = 462,
	DieTestHiddenSuccess = 4621,
	DieTestHiddenFailure = 4622,
	DieTestUndetected = 463,
	DieTestUndetectedSuccess = 4631,
	DieTestUndetectedFailure = 4632,
	DieTestDeafened = 464,
	DieTestDeafenedSuccess = 4641,
	DieTestDeafenedFailure = 4642,
	DieTestStupefied = 465,
	DieTestStupefiedSuccess = 4651,
	DieTestStupefiedFailure = 4652,

	// Dialog = 5
	DialogEyes = 51,
	DialogLook = 52,
	DialogSpeech = 53,
	DialogThought = 54,
	DialogOutOfCharacter = 55,

	// Condition = 6
	ConditionDead = 61,
	ConditionUnconcious = 62,

	// Prompt = 7
	PromptSpacer = 70,
	PromptChecked = 701,
	PromptUnchecked = 702,
	PromptGreenArrowRight = 703,
	PromptYes = 71,
	PromptNo = 711,
	PromptNice = 712,
	PromptPleaseWait = 72,

	MapMoveNorthWest = 8100,
	MapMoveNorth = 8101,
	MapMoveNorthEast = 8102,
	MapMoveWest = 8103,
	MapMoveCenter = 8104,
	MapMoveEast = 8105,
	MapMoveSouthWest = 8106,
	MapMoveSouth = 8107,
	MapMoveSouthEast = 8108,

	// Other = 9
	AoN = 90,
	Tupperbox = 900,
	Rollem = 901,

	SageMissingPerms = 998,
	Sage = 999,
}

export type IEmoji = {
	/** @deprecated The old number value of EnumType. Remove when all old data is converted to remove "type". */
	type: EmojiType;
	/** Array of string literal matches that trigger the emoji. */
	matches: string[];
	/** The emoji (one or more) to replace the match with. */
	replacement: string;
};

type EmojiCategory = "Command" | "Condition" | "Dialog" | "Dice" | "DiceResults" | "Logo" | "Map" | "MapMovement" | "Permission";

export type IEmojiV2 = {
	/** @deprecated The old number value of EnumType. Remove when all old data is converted to remove "type". */
	type: number;
	/** Command, Condition, Dialog, Dice, DiceResults, Map, Permission, etc. */
	category: EmojiCategory;
	/** Specifies if users can change/customize this emoji. */
	isCustomizable: boolean;
	/** @deprecated The old string value of EnumType. Remove when all old data is converted to remove "type". */
	label: string;
	/** The name of the emoji. */
	name: string;
	/** Array of string literal matches that trigger the emoji. */
	matches: string[];
	/** The emoji (one or more) to replace the match with. */
	replacement: string;
};

export interface IHasEmoji {
	emoji?: IEmoji[];
}
export interface IHasEmojiCore {
	emoji: Emoji;
	emojify(text: string): string;
}
