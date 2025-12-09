type ValuedCondition = typeof ValuedConditions[number];
const ValuedConditions = [
	"bleeding", // x or XdY
	"burning",  // x or XdY; 1d6 def
] as const;

type ToggledCondition = typeof ToggledConditions[number];
const ToggledConditions = [
	"asleep",      // helpless
	"blinded",     // "flat-footed"
	"confused",
	"cowering",    // "flat-footed"
	"dazed",
	"dazzled",
	"dead",        // prone
	"deafened",
	"dying",       // unconscious
	"encumbered",
	"entangled",
	"exhausted",
	"fascinated",
	"fatigued",
	"flat-footed",
	"frightened",
	"grappled",
	"helpless",
	"nauseated",
	"off-kilter",  // flat-footed
	"off-target",
	"overburdened",
	"panicked",
	"paralyzed",
	"pinned",      // flat-footed
	"prone",
	"shaken",
	"sickened",
	"stable",      // unconscious
	"staggered",
	"stunned",     // flat-footed
	"unconscious", // helpless, prone
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
			case "asleep": return ["helpless"];
			case "blinded": return ["flat-footed"];
			case "cowering": return ["flat-footed"];
			case "dead": return ["prone"];
			case "dying": return ["unconscious"];
			case "off-kilter": return ["flat-footed"];
			case "pinned": return ["flat-footed"];
			case "stable": return ["unconscious"];
			case "stunned": return ["flat-footed"];
			case "unconscious": return ["helpless", "prone"];
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
