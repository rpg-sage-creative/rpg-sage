import { regex } from "regex";

type Options = { globalFlag?: boolean; };

export function getDiceRegex(options?: Options): RegExp {
	const flags = options?.globalFlag ? "gi" : "i";
	return regex(flags)`
		(?<sign> [\-+\/*] )?    # capture optional math sign

		# optional non-capture group for fixed rolls
		(
			\s*                 # optional space
			\(                  # open parentheses
				# non-optional capture group for fixed rolls
				(?<fixedValues>
					\s*         # optional space
					\d*         # fixed roll value <-- (allow empty in the event of an empty macro arg)
					(
						\s*     # optional space
						,       # comma delimiter for multiple values
						\s*     # optional space
						\d+     # additional fixed roll values
					)*
					\s*         # optional space
				)
			\)                  # close parentheses
		)?

		# non-optional non-capture group for die count / word break
		(
			\s*                 # optional space    <-- SHOULD WE ALLOW THIS?
			(?<dieCount> \d+ )  # capture die count
			|                   # or
			\b                  # allows for "d20" (no count) while excluding "add20"
		)

		d                       # die size indicator
		(?<dieSize> \d+ )       # capture die size
	`;
}