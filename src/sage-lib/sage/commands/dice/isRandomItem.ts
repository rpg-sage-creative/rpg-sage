/** Compares the value against regex to determine if it is a simple random item list. */
export function isRandomItem(value: string): boolean {
	const RANDOM_REGEX = /\[(\d+[usgm]*#)?([^,\]]+)(,([^,\]]+))+\]/i;
	return RANDOM_REGEX.test(value);
}