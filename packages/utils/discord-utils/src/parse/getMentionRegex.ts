import { getOrCreateRegex, type RegExpAnchorOptions, type RegExpCaptureOptions, type RegExpFlagOptions } from "@rsc-utils/core-utils";

type MentionType = "channel" | "role" | "user";

type Options = RegExpFlagOptions & RegExpCaptureOptions & RegExpAnchorOptions & {
	type: MentionType;
};

/**
 * @internal
 * Returns a regex that will match the given type of mention, including named capture groups based on type: channelId, roleId, userId.
 * RegExp Reminder: globalFlag ("g") only matches multiples at top level when you use "".match(); .exec() returns next match
 * Default options: { globalFlag:false, anchored:false }
 */
function createMentionRegex(options?: Options): RegExp {
	const { capture, gFlag = "", iFlag = "", type = "user" } = options ?? {};
	const flags = `${gFlag}${iFlag}`;

	let prefix = "";
	switch(type) {
		case "channel":
			prefix = "#";
			break;
		case "role":
			prefix = "@&";
			break;
		case "user":
			prefix = "@\\!?";
			break;
	}

	return capture
		? new RegExp(`<${prefix}(?<${type}Id>\\d{16,})>`, flags)
		: new RegExp(`<${prefix}\\d{16,}>`, flags);
}

export function getMentionRegex(options?: Options): RegExp {
	return getOrCreateRegex(createMentionRegex, options);
}