
export function doMath(noBraces: string): string | null {
	try {
		if (/^[\s()\d*/+\-^]+$/i.test(noBraces)) {
			const equation = noBraces
				.replace(/ /g, "")
				.replace(/(\d+)\(([^)]+)\)/g, "($1*($2))")
				.replace(/(\d)\(/g, "$1*(")
				.replace(/\^/g, "**")
				;
			return String(eval(equation));
		}
	} catch (ex) {
		/* ignore */
	}
	return null;
}
