import { regex } from "regex";
import { NumberRegExp } from "../../number/isNumberString.js";

/**
 * Matches an possibly signed number (integer or decimal) in any of the following quotes: "", “”, '', ‘’.
 * The number may have spaces on either side of it.
 */
export const QuotedNumberRegExp = regex()`
	# "" simple double quotes
	" \g<number> "

	|

	# “” fancy double quotes
	“ \g<number> ”

	|

	# '' simple single quotes
	' \g<number> '

	|

	# ‘’ fancy single quotes
	‘ \g<number> ’


	(?(DEFINE)
		(?<number>
			\s*              # optional spaces
			${NumberRegExp}
			\s*              # optional spaces
		)
	)
`;
