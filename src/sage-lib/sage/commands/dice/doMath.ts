/**
 * Ensures the value has only mathematical characters before performing an eval to get the math results.
 * Valid characters: ()+-/*^ and spaces and numbers
 */
export function doMath(noBraces: string): string | null {
	try {
		if (/^[ ()\d*/+\-^]+$/i.test(noBraces)) {
			const equation = noBraces
				// remove spaces
				.replace(/ /g, "")
				// change x(y) to (x*(y))
				.replace(/(\d+)\(([^)]+)\)/g, "($1*($2))")
				// change x( to x*(
				.replace(/(\d)\(/g, "$1*(")
				// change power symbol
				.replace(/\^/g, "**")
				;
			return String(eval(equation));
		}
	} catch (ex) {
		/* ignore */
	}
	return null;
}
