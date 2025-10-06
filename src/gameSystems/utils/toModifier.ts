export function toModifier(value: number, spaced = false): string {
	return `${value < 0 ? "-" : "+"}${spaced ? " " : ""}${Math.abs(value)}`;
}