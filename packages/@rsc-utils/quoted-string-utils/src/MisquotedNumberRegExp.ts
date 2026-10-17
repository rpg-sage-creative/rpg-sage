import { NumberRegExp } from "@rsc-utils/type-utils";
import { regex } from "regex";

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