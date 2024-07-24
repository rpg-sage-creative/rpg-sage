import type { Optional } from "@rsc-utils/core-utils";

export enum DialogPostType {
	Embed = 0,
	Post = 1
}

export function parseDialogPostType(value: Optional<string>): DialogPostType | undefined {
	if (value) {
		if (/\b(content|post)\b/i.test(value)) {
			return DialogPostType.Post;
		}
		if (/\bembed\b/i.test(value)) {
			return DialogPostType.Embed;
		}
	}
	return undefined;
}
