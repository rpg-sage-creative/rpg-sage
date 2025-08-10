type ValuedCondition = typeof ValuedConditions[number];
const ValuedConditions = [
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
] as const;

type ToggledCondition = typeof ToggledConditions[number];
const ToggledConditions = [
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
] as const;

export class Condition {
	// public constructor(public name: string) { }

	public static isConditionKey(condition: string): "valued" | "toggled" | false;
	public static isConditionKey(condition: string, which?: "valued" | "toggled"): boolean;
	public static isConditionKey(condition: string, which?: "valued" | "toggled"): "valued" | "toggled" | boolean {
		const lower = condition.toLowerCase();

		// check valued
		const checkValued = !which || which == "valued";
		if (checkValued && Condition.isValuedCondition(lower)) {
			return which ? true : "valued";
		}

		// check toggled
		const checkToggled = !which || which === "toggled";
		if (checkToggled && Condition.isToggledCondition(lower)) {
			return which ? true : "toggled";
		}

		return false;
	}

	/** These conditions are removed when their value reaches 0. */
	public static readonly ValuedConditions = ValuedConditions;

	public static isValuedCondition(lower: Lowercase<string>): lower is ValuedCondition {
		return ValuedConditions.includes(lower as ValuedCondition);
	}

	/** These conditions are either on or off. */
	public static readonly ToggledConditions = ToggledConditions;

	public static isToggledCondition(lower: Lowercase<string>): lower is ToggledCondition {
		return ToggledConditions.includes(lower as ToggledCondition);
	}

	/** @todo figure out if i even need a recursive option */
	public static getConditionRiders(condition: ToggledCondition | ValuedCondition): string[] {
		switch(condition.toLowerCase()) {
			case "confused": return ["off-guard"];
			case "encumbered": return ["clumsy 1", "-10ft speed"];
			case "grabbed": return ["off-guard", "immobilized"];
			case "invisible": return ["undetected"];
			case "paralyzed": return ["off-guard"];
			case "prone": return ["off-guard"];
			case "restrained": return ["off-guard", "immobilized"];
			case "suppressed": return ["-5ft speed"];
			case "unconscious": return ["blinded", "off-guard", "prone"];
			case "unnoticed": return ["undetected"];
			case "untethered": return ["clumsy", "off-guard"];
			default: return [];
		}
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
