/** @internal Ensures we have a string, prepending a NewLine if needed. */
export function getValueToAppend(value: string | null, newLine: boolean): string {
	return `${newLine ? "\n" : ""}${value ?? ""}`;
}