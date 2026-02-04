import type { Optional } from "@rsc-utils/core-utils";

export enum DicePostType {
	SinglePost = 0,
	SingleEmbed = 1,
	MultiplePosts = 2,
	MultipleEmbeds = 3
}

const MultipleEmbedsRegExp = /\bmulti(ple)?[ -]?embeds?\b/i;
const MultiplePostsRegExp = /\bmulti(ple)?[ -]?posts?\b/i;
const SingleEmbedRegExp = /\b(single[ -]?)?embed\b/i;
const SinglePostRegExp = /\b(single[ -]?)?post\b/i;

export function parseDicePostType(value: Optional<string>): DicePostType | undefined {
	if (value) {
		if (MultipleEmbedsRegExp.test(value)) {
			return DicePostType.MultipleEmbeds;
		}
		if (MultiplePostsRegExp.test(value)) {
			return DicePostType.MultiplePosts;
		}
		if (SingleEmbedRegExp.test(value)) {
			return DicePostType.SingleEmbed;
		}
		if (SinglePostRegExp.test(value)) {
			return DicePostType.SinglePost;
		}
	}
	return undefined;
}
