/** Simple dice string formats in the form of XdY+-Z */
export type TSimpleDice =
	`${number}d${number}`
	| `-${number}d${number}`
	| `+${number}d${number}`
	| `${number}d${number}-${number}`
	| `${number}d${number}+${number}`
	| `-${number}d${number}-${number}`
	| `-${number}d${number}+${number}`
	| `+${number}d${number}-${number}`
	| `+${number}d${number}+${number}`
	;
