import { regex } from "regex";
let regexp: RegExp;
export function redactMdLink(content: string): string {
	// let's redact links
	regexp ??= regex("gi")`
		\[
			[^\]]+
		\]
		\(
			(
			<(s?ftp|https?)://[^\)]+>
			|
			(s?ftp|https?)://[^\)]+
			)
		\)
	`;
	return content.replace(regexp, link => "".padEnd(link.length, "*"));
}