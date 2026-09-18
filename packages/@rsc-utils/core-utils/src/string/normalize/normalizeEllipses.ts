const EllipsesRegExp = /…/g;

/** Converts ellipses character to ... */
export function normalizeEllipses(text: string): string {
	return text.replace(EllipsesRegExp, `...`);
}
