/** Simple function to ensure everywhere we mark a value as the result of an explosion, we do it the same. */
export function markAsExplosion(value: number | string): string {
	return `${value}⁺`;
}