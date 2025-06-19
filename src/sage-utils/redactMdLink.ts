import { regex } from "regex";
export function redactMdLink(content: string): string {
	// let's redact links
	const regexp = regex("gi")`
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