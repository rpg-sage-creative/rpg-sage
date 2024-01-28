/** Used to wrap parentheses, brackets, or braces around a piece of text. */
export function wrap(input: string, chars: "[]"): string;
export function wrap(input: string, chars: "{}"): string;
export function wrap(input: string, chars: "()"): string;
export function wrap(input: string, chars: string): string;
export function wrap(input: string, chars: string): string {
	const [l, r] = chars;
	return `${l}${input}${r}`;
}
