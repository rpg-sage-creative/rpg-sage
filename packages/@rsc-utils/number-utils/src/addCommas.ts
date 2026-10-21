const CommaReplacerRegExp = /\B(?=(\d{3})+(?!\d))/g;

/** Adds commas to the given. Ex: 12345 becomes "12,345" */
export function addCommas(value: number | bigint): string {
	// split value
	const [integer, fraction] = String(value).split(".");
	// add commas to integer
	const withCommas = String(integer).replace(CommaReplacerRegExp, ",");
	// return correct output
	return fraction ? `${withCommas}.${fraction}` : withCommas;
}
