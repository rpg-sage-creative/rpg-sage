import type { Optional } from "@rsc-utils/type-utils";
import { regex } from "regex";
import type { RedactOptions } from "./RedactOptions.js";

const MarkdownLinkRegExpG = regex("gi")`
	\[
		(?<label> [^\]]+ )
	\]
	\(
		(?:
			<
				(?<escapedUrl> (s?ftp|https?)://[^\>]+ )
			>
			|
			(?<unEscapedUrl> (s?ftp|https?)://[^\)]+ )
		)
	\)
`;

export type RedactMdLinksOptions = RedactOptions & {
	/** What character to use for redacted labels. */
	labelChar?: string;
	/** What character to use for redacted urls. */
	urlChar?: string;
};

export function redactMdLinks(content: string, redactedCharacter?: string): string;

export function redactMdLinks(content: string): string;
export function redactMdLinks(content: string, redactedCharacter: string | undefined): string;
export function redactMdLinks(content: string, options: RedactMdLinksOptions): string;

export function redactMdLinks(content: Optional<string>): Optional<string>;
export function redactMdLinks(content: Optional<string>, redactedCharacter: string | undefined): Optional<string>;
export function redactMdLinks(content: Optional<string>, options: RedactMdLinksOptions): Optional<string>;

export function redactMdLinks(content: Optional<string>, charOrOpts?: string | RedactMdLinksOptions): Optional<string> {
	if (!content) return content;

	const { char = "*", complete, labelChar = char, punctuationChar = char, urlChar = char } = typeof(charOrOpts) === "string"
		? { char:charOrOpts }
		: charOrOpts ?? {};

	const [rLeftBracket, rRightBracket, rLeftParen, rRightParen, rLeftAngle, rRightAngle] = complete ? "".padEnd(6, punctuationChar) : "[]()<>";

	return content.replace(MarkdownLinkRegExpG, (_, label, escapedUrl, unescapedUrl) => {
		const rLabel = "".padEnd(label.length, labelChar);
		if (escapedUrl) {
			const rEscapedUrl = "".padEnd(escapedUrl.length, urlChar);
			return rLeftBracket + rLabel + rRightBracket + rLeftParen + rLeftAngle + rEscapedUrl + rRightAngle + rRightParen;
		}
		const rUnescapedUrl = "".padEnd(unescapedUrl.length, urlChar);
		return rLeftBracket + rLabel + rRightBracket + rLeftParen + rUnescapedUrl + rRightParen;
	});
}