/* Remember to use globalizeRegex if we switch any of these to using regex`` */

// import { globalizeRegExp } from "./globalizeRegExp.js";

/**
 * Matches one or more adjacent whitespace character(s):
 * /\s+/
 */
export const WhitespaceRegExp = /\s+/;

/**
 * Matches all instances of one or more adjacent whitespace character(s):
 * /\s+/g
 * (global version of WhitespaceRegExp)
 */
export const WhitespaceRegExpG = /\s+/g;

/**
 * Matches zero or more adjacent whitespace character(s):
 * /\s*\/
 */
export const OptionalWhitespaceRegExp = /\s*/;

/**
 * Matches one or more adjacent horizontal only whitespace character(s):
 * /[^\S\r\n]+/
 */
export const HorizontalWhitespaceRegExp = /[^\S\r\n]+/;

/**
 * Matches all instances of one or more adjacent horizontal only whitespace character(s):
 * /[^\S\r\n]+/g
 * (global version of HorizontalWhitespaceRegExp)
 */
export const HorizontalWhitespaceRegExpG = /[^\S\r\n]+/g;

/**
 * Matches zero or more adjacent horizontal only whitespace character(s):
 * /[^\S\r\n]*\/
 */
export const OptionalHorizontalWhitespaceRegExp = /[^\S\r\n]*/;
