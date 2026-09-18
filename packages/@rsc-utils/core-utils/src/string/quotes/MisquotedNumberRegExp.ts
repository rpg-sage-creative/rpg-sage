import { regex } from "regex";
import { NumberRegExp } from "../../number/isNumberString.js";

export const MisquotedNumberRegExp = regex()`
	# mismatched double quotes
	[“”"] \g<number> [“”"]

	|

	# mismatched single quotes
	['‘’] \g<number> ['‘’]


	(?(DEFINE)
		(?<number>
			\s*              # optional spaces
			${NumberRegExp}
			\s*              # optional spaces
		)
	)
`;