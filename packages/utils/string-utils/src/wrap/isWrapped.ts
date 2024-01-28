
/** Returns the characters wrapping the content (if parentheses, brackets, or braces) or false. */
export function isWrapped(input: string): string | false;

/** Returns the given chars if it is wrapping the content. Retruns false otherwise. */
export function isWrapped(input: string, chars: "[]"): string | false;

/** Returns the given chars if it is wrapping the content. Retruns false otherwise. */
export function isWrapped(input: string, chars: "{}"): string | false;

/** Returns the given chars if it is wrapping the content. Retruns false otherwise. */
export function isWrapped(input: string, chars: "()"): string | false;

/** Returns the given chars if it is wrapping the content. Retruns false otherwise. */
export function isWrapped(input: string, chars: string): string | false;

export function isWrapped(input: string, chars?: string): string | false {
	const checks: string[] = [];
	if (chars?.length === 2) {
		checks.push(chars);
	}
	if (!checks.length) {
		checks.push("[]", "{}", "()");
	}
	return checks.find(([l, r]) => input.startsWith(l) && input.endsWith(r)) ?? false;
}