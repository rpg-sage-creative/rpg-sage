import XRegExp from "xregexp";

/** Convenience for creating/sharing quoted value regex in case we change it later. */
export function createQuotedRegex(allowEmpty: boolean): RegExp {
	return XRegExp(getQuotedRegexSource(allowEmpty ? "*" : "+"));
}

/** Removes first and last character if they are both quotes. */
export function dequote(value: string): string {
	return isQuoted(value) ? value.slice(1, -1) : value;
}

/** Returns the string source of our quoted value regex. */
export function getQuotedRegexSource(s: "*" | "+"): string {
	return `(?:“[^”]${s}”|„[^“]${s}“|„[^”]${s}”|"[^"]${s}")`;
}

/** Returns true if the value begins and ends in quotes, false otherwise. */
export function isQuoted(value: string): boolean {
	const regex = XRegExp(`^${getQuotedRegexSource("*")}$`);
	return value.match(regex) !== null;
}

/** Puts quotes around a value; if the value has quotes in it, it will try various fancy quotes until it won't break. */
export function quote(value: string): string {
	if (value.includes(`"`)) {
		//“[^”]${s}”|„[^“]${s}“|„[^”]${s}”|"[^"]${s}"
		if (!value.match(/[“”]/)) {
			return `“${value}”`;
		}
		if (!value.match(/[„“]/)) {
			return `„${value}“`;
		}
		if (!value.match(/[„”]/)) {
			return `„${value}”`;
		}
	}
	return `"${value}"`;
}

//#region (Single Quotes, Double Quotes, Dequote)

/*
// const DOUBLE_ARROW_LEFT = "\u00AB";
// const DOUBLE_ARROW_RIGHT = "\u00BB";
// const DOUBLE_REGEX = XRegExp(`[${DOUBLE_LEFT}${DOUBLE_RIGHT}]`, "g");
*/

/*
// const SINGLE = "\u0027";
// const SINGLE_LEFT = "\u2018";
// const SINGLE_RIGHT = "\u2019";
// const SINGLE_LEFT_LOW = "\u201A";
// const SINGLE_ARROW_LEFT = "\u2039";
// const SINGLE_ARROW_RIGHT = "\u203A";
// const SINGLE_ENGLISH = `${SINGLE_LEFT}[^${SINGLE_RIGHT}]*${SINGLE_RIGHT}`;
// const SINGLE_REGEX = XRegExp(`[${SINGLE_LEFT}${SINGLE_RIGHT}]`, "g");
*/
/*
// const DOUBLE = "\u0022";
// const DOUBLE_LEFT = "\u201C";
// const DOUBLE_RIGHT = "\u201D";
// const DOUBLE_LEFT_LOW = "\u201E";
*/

/*
// const DOUBLE_ENGLISH = `${DOUBLE_LEFT}[^${DOUBLE_RIGHT}]*${DOUBLE_RIGHT}`;
// const DOUBLE_FRENCH = `${DOUBLE_ARROW_LEFT}[^${DOUBLE_ARROW_RIGHT}]*${DOUBLE_ARROW_RIGHT}`;
// const DOUBLE_GERMAN = `${DOUBLE_LEFT_LOW}[^${DOUBLE_LEFT}]*${DOUBLE_LEFT}`;
// const DOUBLE_POLISH = `${DOUBLE_LEFT_LOW}[^${DOUBLE_RIGHT}]*${DOUBLE_RIGHT}`;
// const DOUBLE_SWEDISH = `${DOUBLE_ARROW_RIGHT}[^${DOUBLE_ARROW_LEFT}]*${DOUBLE_ARROW_LEFT}`;
// const DOUBLE_UNIVERSAL = `${DOUBLE}[^${DOUBLE}]*${DOUBLE}`;
*/

/*
// const DEQUOTE_REGEX = XRegExp(`^[${DOUBLE}${DOUBLE_LEFT}${DOUBLE_LEFT_LOW}][^${DOUBLE}${DOUBLE_LEFT}${DOUBLE_LEFT_LOW}${DOUBLE_RIGHT}]*[${DOUBLE}${DOUBLE_LEFT}${DOUBLE_RIGHT}]$`);
// const DEQUOTE_REGEX_STRICT = XRegExp(`^(${DOUBLE_ENGLISH}|${DOUBLE_GERMAN}|${DOUBLE_POLISH}|${DOUBLE_UNIVERSAL})$`);
*/

//#endregion
