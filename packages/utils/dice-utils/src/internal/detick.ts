/** @internal */
export function detick(value: string): string {
	return value.replace(/`/g, "");
}