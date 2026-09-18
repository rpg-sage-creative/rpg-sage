/* Remember to use globalizeRegex if we switch any of these to using regex`` */

export const WhitespaceRegExp = /\s+/;
export const OptionalWhitespaceRegExp = /\s*/;
export const WhitespaceRegExpG = new RegExp(WhitespaceRegExp, "g");
export const HorizontalWhitespaceRegExp = /[^\S\r\n]+/;
export const OptionalHorizontalWhitespaceRegExp = /[^\S\r\n]*/;
export const HorizontalWhitespaceRegExpG = new RegExp(HorizontalWhitespaceRegExp, "g");
