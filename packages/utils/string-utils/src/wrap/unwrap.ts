
/** Used to unwrap parentheses, brackets, or braces from around a piece of text. */
export function unwrap(input: string, chars: "[]"): string;
export function unwrap(input: string, chars: "{}"): string;
export function unwrap(input: string, chars: "()"): string;
export function unwrap(input: string, chars: string): string;
export function unwrap(input: string, chars: string): string {
	const [l, r] = chars;
	while (input.startsWith(l) && input.endsWith(r)) {
		input = input.slice(1, -1);
	}
	return input;
}
