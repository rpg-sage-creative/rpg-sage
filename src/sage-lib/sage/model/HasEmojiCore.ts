import type Emoji from "./Emoji";

export enum EmojiType {

	// Command = 1,
	CommandSuccess = 11,
	CommandFailure = 12,
	CommandWarn = 13,
	CommandError = 14,
	CommandDelete = 15,
	CommandPin = 16,

	// Permission = 2
	PermissionDenied = 21,
	PermissionPatreon = 22,

	// Actions = 3
	ActionsOne = 31,
	ActionsTwo = 32,
	ActionsThree = 33,
	ActionsReaction = 34,
	ActionsFree = 35,

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

	// Condition = 6
	ConditionDead = 61,
	ConditionUnconcious = 62,

	// Prompt = 7
	PromptSpacer = 70,
	PromptChecked = 701,
	PromptUnchecked = 702,
	PromptYes = 71,
	PromptNo = 711
}

export type IEmoji = {
	type: EmojiType;
	matches: string[];
	replacement: string;
};

export interface IHasEmoji {
	emoji?: IEmoji[];
}
export interface IHasEmojiCore {
	emoji: Emoji;
	emojify(text: string): string;
}
