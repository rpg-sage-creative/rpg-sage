/** Grabs all simple macro args, _NO_ nested brackets. */
const SimpleMacroArgRegExp = /\{.*?\}/g;

/** Proper function is more efficient than an arrow function. */
function replaceMacroArgWithDefaultValue(arg: string): string {
	return arg
		// slice off brackets
		.slice(1, -1)
		// split contents to get[value, defaultValue]
		.split(":")
		// return default value
		[1]?.trim()
		// or empty string
		?? "";
}

/**
 * Replaces each arg match with its defaultValue or an empty string.
 * {key} becomes "".
 * {key:def} becomes "def"
 */
export function replaceMacroArgsWithDefaultValues(diceString: string): string {
	return diceString.replace(SimpleMacroArgRegExp, replaceMacroArgWithDefaultValue);
}