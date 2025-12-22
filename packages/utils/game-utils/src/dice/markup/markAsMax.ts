/** Simple function to ensure everywhere we bold a value, we do it the same. */
export function markAsMax(value: number | string): string {
	return `<b>${value}</b>`;
}