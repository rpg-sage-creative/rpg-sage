import { regex } from "regex";

/** Matches some mismatched double quoted pairs, with content optional. */
export const MisquotedContentRegExp = regex()`
	# mismatched double quotes
	[“”"]
	(
		[^“”"]        # any non-quote
		|             # or
		(?<=\\)[“”"]  # quote after a slash
	)*
	[“”"]

	|

	# mismatched single quotes
	['‘’]
	(
		[^'‘’]      # any non-quote
		|         # or
		(?<=\\)['‘’]  # quote after a slash
	)*
	['‘’]
`;
