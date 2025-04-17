type Options = {
	charClass?: boolean;
	vFlag?: "v";
};

/*

\$, \(, \), \*, \+, \., \/, \?, \[, \\, \], \^, \{, \|, \}: valid everywhere

\-: only valid inside character classes

\!, \#, \%, \&, \,, \:, \;, \<, \=, \>, \@, \`, \~: only valid inside v-mode character classes

*/

/**
 * Escapes RegExp special characters in the given value.
 * If charClass is true, then "-" will be escaped as well.
 * if charClass is true and vFlag is "v", then "!#%&,:;<=>@`~" characters will be escaped, too.
 */
export function escapeRegex(value: string, options?: Options): string {
	const global = "$()*+./?[]\\^{}|";
	const charClass = options?.charClass ? "-" : "";
	const vFlag = options?.charClass && options.vFlag ? "!#%&,:;<=>@`~" : "";
	const chars = global + charClass + vFlag;
	return value.split("").map(s => chars.includes(s) ? `\\${s}` : s).join("");
}