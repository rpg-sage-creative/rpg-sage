export function isRandomItem(value: string): boolean {
	const RANDOM_REGEX = /\[(\d+[usgm]*#)?([^,\]]+)(,([^,\]]+))+\]/i;
	return RANDOM_REGEX.test(value);
}