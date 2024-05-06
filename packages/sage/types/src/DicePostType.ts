import type { Optional } from "@rsc-utils/type-utils";

export enum DicePostType {
	SinglePost = 0,
	SingleEmbed = 1,
	MultiplePosts = 2,
	MultipleEmbeds = 3
}

export function parseDicePostType(value: Optional<string>): DicePostType | undefined {
	if (value) {
		if (/\bmulti(ple)?[ -]?embeds?\b/i.test(value)) {
			return DicePostType.MultipleEmbeds;
		}
		if (/\bmulti(ple)?[ -]?posts?\b/i.test(value)) {
			return DicePostType.MultiplePosts;
		}
		if (/\bembed\b/i.test(value)) {
			return DicePostType.SingleEmbed;
		}
		if (/\bpost\b/i.test(value)) {
			return DicePostType.SinglePost;
		}
	}
	return undefined;
}
