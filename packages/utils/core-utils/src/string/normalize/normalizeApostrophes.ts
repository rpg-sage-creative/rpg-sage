
/** Converts forward/back apostrophe characters to ' */
export function normalizeApostrophes(text: string): string {
	/*// return text.replace(SINGLE_REGEX, SINGLE);*/
	return text.replace(/[\u2018\u2019]/g, `'`);
}
