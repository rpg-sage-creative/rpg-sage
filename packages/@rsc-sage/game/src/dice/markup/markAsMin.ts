/** Simple function to ensure everywhere we italicize a value, we do it the same. */
export function markAsMin(value: number | string): string {
	return `<i>${value}</i>`;
}