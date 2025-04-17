
/** Removes accents from letters. Ex: "à" becomes "a" */
export function removeAccents(value: string): string {
	return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
