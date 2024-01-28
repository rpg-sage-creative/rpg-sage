import { type RegExpCreateOptions } from "@rsc-utils/string-utils";

type MentionType = "channel" | "role" | "user";

type Options = Omit<RegExpCreateOptions, "quantifier"> & {
	anchored?: boolean;
};

/**
 * @internal @private
 * Returns a regex that will match the given type of mention, including named capture groups based on type: channelId, roleId, userId.
 * RegExp Reminder: globalFlag ("g") only matches multiples at top level when you use "".match(); .exec() returns next match
 * Default options: { globalFlag:false, anchored:false }
 */
export function createMentionRegex(type: MentionType, options?: Options): RegExp {
	const capture = options?.capture;
	const flags = options?.globalFlag ? "g" : "";

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

	let regex = `<${prefix}(?<${type}Id>\\d{16,})>`;
	if (options?.anchored) {
		regex = `^${regex}$`;
	}

	if (capture) {
		if (capture === true) {
			return new RegExp(`(${regex})`, flags);
		}
		return new RegExp(`(?<${capture}>${regex})`, flags);
	}
	return new RegExp(regex, flags);
}
