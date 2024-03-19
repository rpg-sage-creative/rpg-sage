import { Optional } from "@rsc-utils/type-utils";

export enum PostType {
	Content = 0,
	Embed = 1
}

export function parsePostType(value: Optional<string>): PostType | undefined {
	if (value) {
		if (/\b(content|post)\b/i.test(value)) {
			return PostType.Content;
		}
		if (/\bembed\b/i.test(value)) {
			return PostType.Embed;
		}
	}
	return undefined;
}
