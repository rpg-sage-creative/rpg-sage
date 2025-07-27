/** This strips a trailing comma (,) or semicolon (;) */
export function cleanDicePartDescription(description?: string): string {
	const replaced = (description ?? "").replace(/[;,]\s*$/, "");
	return replaced.replace(/\s+/g, " ");
}
