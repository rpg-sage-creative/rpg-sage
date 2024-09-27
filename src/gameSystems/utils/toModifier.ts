export function toModifier(value: number): string {
	return (value < 0 ? "" : "+") + String(value);
}