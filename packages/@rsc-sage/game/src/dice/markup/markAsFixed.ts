/** Simple function to ensure everywhere we mark a value as fixed, we do it the same. */
export function markAsFixed(value: number | string): string {
	return `${value}f`;
}