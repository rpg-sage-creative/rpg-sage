import type { Optional } from "@rsc-utils/core-utils";

export enum DialogPostType {
	Embed = 0,
	Post = 1
}

export const EmbedRegExp = /\bembed\b/i;
export const PostRegExp = /\b(content|post)\b/i;

export function parseDialogPostType(value: Optional<string>): DialogPostType | undefined {
	if (value) {
		if (PostRegExp.test(value)) {
			return DialogPostType.Post;
		}
		if (EmbedRegExp.test(value)) {
			return DialogPostType.Embed;
		}
	}
	return undefined;
}
