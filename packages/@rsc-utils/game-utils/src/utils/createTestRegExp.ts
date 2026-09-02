import { escapeRegex } from "@rsc-utils/core-utils";
// import { wrapRegex } from "../dice/math/internal/wrapRegex.js";
// import { pattern, regex } from "regex";

// const PosNegWholeNumberRegExp = /[\-\+]?\d+\b/;
// const valueRegExp = wrapRegex(PosNegWholeNumberRegExp, ["||||", "()"], { or:true });
const valueRegExpSource = "\\(\\s*(?:\\|\\|\\s*(?:[\\-\\+]?\\d+\\b)\\s*\\|\\||(?:[\\-\\+]?\\d+\\b))\\s*\\)|(?:\\|\\|\\s*(?:[\\-\\+]?\\d+\\b)\\s*\\|\\||(?:[\\-\\+]?\\d+\\b))";

/** Accepts an array of test targets and creates a single RegExp to match. */
export function createTestRegExp(aliases: string[]): RegExp {
	// const spaceSafeAliases = aliases.map(alias => alias.replaceAll(" ", "\\s*"));
	// const aliasPattern = pattern(spaceSafeAliases.join("|"));

	// return regex("i")`
	// 	(?<! [a-z] )
	// 	(?<testAlias> ${aliasPattern} )
	// 	\s*
	// 	(?<testValue> ${valueRegExp} )
	// `;

	// while using regex above is cleaner looking, this is less overhead ...
	// ... and we do this function *a lot*

	const aliasesSource = aliases.map(alias =>
		alias
			// split each alias on space, ex: "vs ac"
			.split(" ")
			// escape the non-space characters
			.map(escapeRegex)
			// join with optional space regexp
			.join("\\s*")
	// rejoin the aliases with an OR
	).join("|");

	return new RegExp(
		// don't match when preceded by letters a-z; start
		"(?<![a-z])"
		// start alias capture group
		+ "(?<testAlias>"
		// add alias source
		+ aliasesSource
		// end alias capture group
		+ ")"
		// allow optional space
		+ "\\s*"
		// start value capture group
		+ "(?<testValue>"
		// add value source
		+ valueRegExpSource
		// end value capture group
		+ ")"

		,
		"i"
	);
}