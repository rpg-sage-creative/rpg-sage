/** How should we handle secret dice rolls. */
export enum DiceSecretMethodType
{
	/** do nothing, don't look for secret dice */
	Ignore = 0,

	/** use markup/markdown spoiler tags for results */
	Hide = 1,

	/** send dice results to a gm channel; or a gm via dm if a gm channel doesn't exist */
	GameMasterChannel = 2,

	/** send dice results to a gm via dm */
	GameMasterDirect = 3
}