export function isEmptyArray(array?: unknown) {
	return Array.isArray(array) && array?.length === 0;
}
