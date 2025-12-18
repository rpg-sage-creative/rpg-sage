import { getEmojiRegex } from "../emoji/getEmojiRegex.js";
import { tokenize } from "@rsc-utils/core-utils";


// <@&number>  role
const RoleRegExp = /<@&\d{16,}>/;

// <@number>   user
const UserRegExp = /<@\d{16,}>/;

type Options = { emoji?:boolean; roles?:boolean; users?: boolean; };
type Parsers = { emoji?:RegExp; role?:RegExp; user?: RegExp; };

function scrubBlankTokens(tokens: string[]): string[] {
	// let's not mutate the original
	const output = tokens.slice();

	// set initial indexes
	let leftIndex = -1;
	let rightIndex = -1;

	// updates indexes and returns true if a valid pair is found
	const findIndexes = (fromIndex: number) => {
		leftIndex = output.indexOf("`", fromIndex + 1);
		rightIndex = output.indexOf("`", leftIndex + 1);
		return leftIndex > -1 && rightIndex > -1;
	};

	// as long as we have valid pairs, see if it is blank
	while (findIndexes(rightIndex)) {
		// grab just the slice between the ticks
		const slice = output.slice(leftIndex, rightIndex + 1).slice(1, -1);

		// is the content only blank space?
		const isBlank = slice.every(s => !s.trim());
		if (isBlank) {
			// if we did left tick first we would have to use -1 to remove right tick

			// remove right tick
			output.splice(rightIndex, 1);

			// remove left tick
			output.splice(leftIndex, 1);

			// update rightIndex now that two values are gone
			rightIndex -= 2;
		}
	}

	// return updated array
	return output;
}

const EscapedRegExp = /`[^`]+`/gu;

/** Looks for text escaped with ` characters that contain emoji (:die: or <:die:12345> or <@1234567890123456> or <@&1234567890123456>) and unescapes them so they render correctly. */
export function correctEscapedMentions(value: string, options: Options): string {
	// if we managed to call this with no options, then simply bail now
	if (!options.emoji && !options.roles && !options.users) return value;

	// replace any escaped spoilers with ?? to avoid revealing the value
	// value = value.replace(/\|\|.*?\|\|/g, "??");

	// declare the parsers but don't get it in case we don't have any matches
	let parsers: Parsers;
	const getParsers = () => {
		if (!parsers) {
			parsers = {};
			if (options.emoji) parsers.emoji = getEmojiRegex();
			if (options.roles) parsers.role = RoleRegExp;
			if (options.users) parsers.user = UserRegExp;
		}
		return parsers;
	};

	// We only need to be concerned with `escaped text` substrings
	return value.replace(EscapedRegExp, escapedValue => {
		// Tokenize the substring so that we can iterate and toggle escaped/unescaped sections
		const tokens = tokenize(escapedValue.slice(1, -1), getParsers());

		// Start with empty string, no emoji, and not escaped
		let output: string[] = [];
		let isMention = false;
		let isEscaped = false;

		tokens.forEach(token => {
			isMention = ["emoji", "role", "user"].includes(token.key);
			// toggle if we are escaped or not, put the tick before we add the token
			if (isMention === isEscaped) {
				output.push("`");
				isEscaped = !isEscaped;
			}
			output.push(token.token);
		});

		// If we are still escaping text, we need the final tick
		if (!isMention) {
			output.push("`");
		}

		// find whitespace between mentions and remove ticks that would escape it
		output = scrubBlankTokens(output);

		return output.join("");
	});
}
