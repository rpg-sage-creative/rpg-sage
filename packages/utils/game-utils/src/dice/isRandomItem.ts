import { regex } from "regex";

const RandomItemRegExp = regex("i")`
	\[

	(
		\d+     # number of items to select
		(
			gm  # gamemaster ... alias for secret dice
			|
			u   # unique
			|
			s   # sorted
		)*
		#       # end of prefix delimiter
	)?

	# first item
	( [^,\]]+ )      # any characters NOT a comma or end bracket

	# subesquent items
	(
		,            # comma
		( [^,\]]+ )  # any characters NOT a comma or end bracket
	)+

	\]
`;

/** Compares the value against regex to determine if it is a simple random item list. */
export function isRandomItem(value: string): boolean {
	return RandomItemRegExp.test(value);
}