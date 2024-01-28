/** Simple function to ensure everywhere we bold a value, we do it the same. */
export function bold(value: string): string {
	return `<b>${value}</b>`;
}

/** Simple function to ensure everywhere we italicize a value, we do it the same. */
export function italics(value: string): string {
	return `<i>${value}</i>`;
}

/** Simple function to ensure everywhere we strike a value, we do it the same. */
export function strike(value: string): string {
	return `<s>${value}</s>`;
}
