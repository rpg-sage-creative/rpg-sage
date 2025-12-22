export enum DiceCriticalMethodType {

	/** Not set, use default if one exists. */
	Unknown = 0,

	/** Multiple the total x 2. */
	TimesTwo = 1,

	/** Roll the dice twice and add them together. */
	RollTwice = 2,

	/** Roll the dice once and add that to the max possible result. */
	AddMax = 3
}