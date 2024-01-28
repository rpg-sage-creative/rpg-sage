/** How many tokens to match with a particular RegExp expression. */
export type RegExpQuantifier =
	/** match one */
	""

	/** match zero or more */
	| "*"

	/** match one or more */
	| "+"

	/** match exact count */
	| `{${number}}`

	/** match x or more */
	| `{${number},}`

	/** match x to y */
	| `{${number},${number}}`;