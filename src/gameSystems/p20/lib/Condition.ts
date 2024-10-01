export class Condition {
	// public constructor(public name: string) { }

	/** These conditions are removed when their value reaches 0. */
	public static getValuedConditions(): string[] {
		return [
			"clumsy",     // status penalty to dex checks/dcs: ac, reflex, ranged attack, acrobatics, stealth, thievery
			"doomed",     // death = dying (max) - doomed; -1 full night's rest
			"drained",    // status penalty to con checks: fort, -level * value hp/maxp; -1 full night's rest
			"dying",      // unconcious, max 4 (default); losing dying conditions increases wounded +1
			"enfeebled",  // status penalty to str checks; str melee atk, str damage, athletics
			"frightened", // status penalty to all checks/dcs; -1 end of turn
			"glitching",  //
			"sickened",   // status penalty to all checks/decs; -1 if retch fort save succeeds (or -2 crit)
			"slowed",     // reduce actions by slowed value
			"stunned",    // (overrides slowed) reduce actions by stunned value, then reduce stunned value by actions lost
			"stupified",  // status penalty to int/wis/cha checks/dcs: will saves, spell attacks, spell dcs, skills
			"wounded",    // if you gain dying while wounded, increase dying by wounded; treat wounds or full hp and 10 minute rest
		];
	}

	/** These conditions are either on or off. */
	public static getToggledConditions(): string[] {
		return [
			"blinded",
			"broken",
			"concealed",
			"confused",    // off-guard, no ally
			"controlled",
			"dazzled",
			"deafened",
			"encumbered",  // clumsy 1, 10ft penalty to all speeds (min 5)
			"fascinated",  // -2 status penalty to perception and skill checks
			"fatigued",    // -1 status penalty to ac / saving throws; recover after full night's rest
			"fleeing",
			"grabbed",     // off-guard, immobilized
			"hidden",
			"immobilized",
			"invisible",   // undetected
			"observed",
			"off-guard",   // -2 circumstance penalty to ac
			"paralyzed",   // off-guard
			// Persistent Damage
			"petrified",
			"prone",       // off-guard, -2 circumstance penalty to attack
			"quickened",   // +1 action per turn
			"restrained",  // (overrides grabbed) off-guard, immobilized
			"suppressed",  // -1 circ to attack, -5 status to speeds
			"unconscious", // -4 status penalty to ac, perception, reflex; blinded, off-guard, prone
			"undetected",
			"unnoticed",   // undetected
			"untethered",  // clumsy, off-guard
		];
	}

	// store as Disposition (default 0) and allow ++ or -- to move up/down the scale of -2 to +2
	// public static getDispositionConditions(): string[] {
	// 	return [
	// 		"friendly",
	// 		"helpful",
	// 		"hostile",
	// 		"indifferent",
	// 		"unfriendly",
	// 	];
	// }
}
