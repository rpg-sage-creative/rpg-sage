import { ZERO_WIDTH_SPACE } from "@rsc-utils/string-utils";

/** Replaces @here and @everyone using ZERO_WIDTH_SPACE so that reposts don't ping channels/servers. */
export function safeMentions(content: string): string {
	return content
		? content.replace(/@(here|everyone)/gi, (_, tag) => `@${ZERO_WIDTH_SPACE}${tag}`)
		: content;
}