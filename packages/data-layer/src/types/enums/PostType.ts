import type { Optional } from "@rsc-utils/core-utils";
import { EmbedRegExp, PostRegExp } from "./DialogPostType.js";

export enum PostType {
	Content = 0,
	Embed = 1
}

export function parsePostType(value: Optional<string>): PostType | undefined {
	if (value) {
		if (PostRegExp.test(value)) {
			return PostType.Content;
		}
		if (EmbedRegExp.test(value)) {
			return PostType.Embed;
		}
	}
	return undefined;
}
