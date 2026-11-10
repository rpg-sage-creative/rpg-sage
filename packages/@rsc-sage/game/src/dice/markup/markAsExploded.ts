/** Simple function to ensure everywhere we mark a value as causing an explosion, we do it the same. */
export function markAsExploded(value: number | string): string {
	return `${value}ₓ`;
}