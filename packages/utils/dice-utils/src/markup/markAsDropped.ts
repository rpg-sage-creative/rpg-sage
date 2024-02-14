/** Simple function to ensure everywhere we strike a value, we do it the same. */
export function markAsDropped(value: number | string): string {
	return `<s>${value}</s>`;
}