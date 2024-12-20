import { type Optional } from "@rsc-utils/core-utils";
import { DiscordMaxValues } from "../types/DiscordMaxValues.js";

/** converts each letter to a regex character class. */
function letterToCharacterClass(letter: string): string {
	switch(letter) {
		// found as problematic for "everyone" and "here"
		case "e": return "[e3]";
		// found as problematic for "discord"
		case "i": return "[il1]";
		// found as problematic for "discord"
		case "o": return "[o0]";
		// found as problematic for "discord"
		case "s": return "[s5]";
		default: return letter;
	}
}

type InvalidUsername = {
	/** is it only invalid when anchored (the whole name vs part of a name) */
	anchored?: boolean;
	/** the "root" name, ex: "discord" or "wumpus" */
	name: string;
	/** do we need to check l33t variants? */
	variants?: boolean;
};

/**
 * https://discord.com/developers/docs/resources/user
 * List current as of 2024/12/18
 * The following are listed as banned but don't throw errors (yet): @, #, :
 *
 * Not part the page's list but discovered through error: clyde, wumpus
 *
 * @todo make this a text file or something that can be reloaded without a restart.
 */
function getInvalidWebhookUsernames(): InvalidUsername[] {
	return [
		{ name:"everyone", anchored:true, variants:true },
		{ name:"here",     anchored:true, variants:true },

		{ name:"discord",  variants:true },
		{ name:"clyde"     },
		{ name:"wumpus",   },

		{ name:"```" },
	];
}

/** Creates a RegExp for testing a specific invalid username. */
function createInvalidTestRegex({ anchored, name, variants }: InvalidUsername): RegExp {
	// start with the name
	let source = name;

	// if we test variants, turn each letter into a character class
	if (variants) {
		const letters = name.split("");
		const characterClasses = letters.map(letterToCharacterClass);
		source = characterClasses.join("");
	}

	// if we only test anchored names, add anchors
	if (anchored) {
		source = `^${source}$`;
	}

	// return regex
	return new RegExp(source, "i");
}

/**
 * If the name isn't defined or has an invalid length, true is returned.
 * If a banned name is found, the "root" value (not the specific variant) is returned.
 * Otherwise, false is returned.
 */
export function isInvalidWebhookUsername(name: Optional<string>): string | boolean {
	if (!name) {
		return true;
	}

	const { minLength, maxLength } = DiscordMaxValues.webhook.username;
	if (name.length < minLength || name.length > maxLength) {
		return true;
	}

	const invalidNames = getInvalidWebhookUsernames();
	for (const invalidName of invalidNames) {
		const regex = createInvalidTestRegex(invalidName);
		if (regex.test(name)) {
			return invalidName.name;
		}
	}

	return false;
}