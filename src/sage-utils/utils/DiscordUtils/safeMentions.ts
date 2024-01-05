import { ZERO_WIDTH_SPACE } from "../consts";

export function safeMentions(content: string): string {
	return content
		? content.replace(/@(here|everyone)/gi, (_, tag) => `@${ZERO_WIDTH_SPACE}${tag}`)
		: content;
}