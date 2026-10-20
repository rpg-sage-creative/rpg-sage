const ApostrophesRegExp = /[\u2018\u2019]/g;

/** Converts forward/back apostrophe characters to ' */
export function normalizeApostrophes(text: string): string {
	return text.replace(ApostrophesRegExp, `'`);
}
