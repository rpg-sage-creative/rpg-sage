import { ZERO_WIDTH_SPACE } from "./consts";

export function safeMentions(content: string): string {
	if (!content) return content;
	return content.replace(/@(here|everyone)/gi, (_, tag) => `@${ZERO_WIDTH_SPACE}${tag}`);
}