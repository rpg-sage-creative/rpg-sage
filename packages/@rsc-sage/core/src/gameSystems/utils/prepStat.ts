/** Prepares a stat to be displayed in a simpleSheet by defaulting to ?? and optionally wrapping in pipes */
export function prepStat(value?: string | number, hasPipes?: boolean): string {
	return hasPipes
		? `||${value ?? "??"}||`
		: String(value ?? "??");
}