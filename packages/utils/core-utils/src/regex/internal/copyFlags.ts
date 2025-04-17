/** @internal Removes the v, u, x, and n flags from the RegExp before fedding flags to regex(flags)`` */
export function copyFlags(regexp: RegExp): string {
	return regexp.flags.replace(/[vuxn]/g, "");
}