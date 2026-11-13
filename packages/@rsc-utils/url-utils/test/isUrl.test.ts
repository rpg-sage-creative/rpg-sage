import { describe, expect, test } from "vitest";
import { isUrl } from "../build/index.js";

describe("url", () => {

	describe("isUrl()", () => {

		test(`rejects null`, () => {
			expect(isUrl(null)).toBe(false);
		});

		test(`rejects undefined`, () => {
			expect(isUrl(undefined)).toBe(false);
		});

		test(`rejects an empty string`, () => {
			expect(isUrl(``)).toBe(false);
		});

		test(`rejects non-string values without throwing`, () => {
			expect(isUrl(42)).toBe(false);
			expect(isUrl({})).toBe(false);
			expect(isUrl([])).toBe(false);
			expect(isUrl(true)).toBe(false);
		});

		test(`requires a protocol`, () => {
			expect(isUrl(`www.google.com`)).toBe(false);
			expect(isUrl(`google.com/q?word=text#marked`)).toBe(false);
		});

		test(`rejects shttp and ftps protocols`, () => {
			expect(isUrl(`shttp://google.com:80/q?word=text#marked`)).toBe(false);
			expect(isUrl(`ftps://google.com:80/q?word=text#marked`)).toBe(false);
			expect(isUrl(`ftps://google.com/q?word=text#marked`)).toBe(false);
		});

		test(`accepts http, https, ftp, and sftp protocols`, () => {
			expect(isUrl(`http://gooGle.com/q?word=text#marked`)).toBe(true);
			expect(isUrl(`https://google.com:80/q?word=text#marked`)).toBe(true);
			expect(isUrl(`ftp://google.com:80/q?word=text#marked`)).toBe(true);
			expect(isUrl(`sftp://google.com:80/q?word=text#marked`)).toBe(true);
		});

		test(`is case insensitive for protocol and host`, () => {
			expect(isUrl(`HTTP://GOOGLE.COM`)).toBe(true);
			expect(isUrl(`HTTPS://Google.Com/Path`)).toBe(true);
		});

	});

	describe("isUrl() hosts", () => {

		test(`accepts a valid ipv4 host`, () => {
			expect(isUrl(`http://192.168.0.1/path`)).toBe(true);
		});

		test(`rejects an ipv4 host with an out-of-range octet`, () => {
			expect(isUrl(`http://999.1.1.1/`)).toBe(false);
		});

		test(`accepts localhost with a port`, () => {
			expect(isUrl(`http://localhost:3000/path`)).toBe(true);
		});

		test(`accepts underscores in subdomains`, () => {
			expect(isUrl(`http://foo_bar.google.com`)).toBe(true);
		});

		test(`accepts unicode domains`, () => {
			expect(isUrl(`http://exämple.de/path`)).toBe(true);
		});

		test(`accepts a raw ipv6 host without brackets`, () => {
			expect(isUrl(`http://2001:db8::85a3:42/x`)).toBe(true);
		});

		test(`rejects the bracketed ipv6 form used by real urls (quirk)`, () => {
			// RFC 3986 hosts write IPv6 as [::1], but UrlRegExp only matches raw addresses.
			expect(isUrl(`http://[::1]:8080/x`)).toBe(false);
		});

		test(`rejects a domain ending in a dot`, () => {
			expect(isUrl(`http://google.com.`)).toBe(false);
		});

	});

	describe("isUrl() auth, port, path", () => {

		test(`accepts userinfo with and without password`, () => {
			expect(isUrl(`https://user:pass@example.com/p`)).toBe(true);
			expect(isUrl(`https://user@example.com`)).toBe(true);
		});

		test(`requires two to five port digits`, () => {
			expect(isUrl(`http://google.com:8/`)).toBe(false);
			expect(isUrl(`https://google.com:80/q?word=text#marked`)).toBe(true);
			expect(isUrl(`https://google.com:65535/q`)).toBe(true);
		});

		test(`rejects a six-digit port`, () => {
			expect(isUrl(`https://google.com:655350/q?word=text#marked`)).toBe(false);
		});

		test(`accepts path, querystring, and anchor characters`, () => {
			expect(isUrl(`http://google.com/`)).toBe(true);
			expect(isUrl(`https://google.com/q?a=b&c=d`)).toBe(true);
			expect(isUrl(`http://google.com/foo.bar_baz~q+x%p-z#frag_1`)).toBe(true);
		});

		test(`accepts a discord attachment url`, () => {
			const url = `https://cdn.discordapp.com/attachments/1173111558428184678/1204632128369983578/image.png?ex=65d57018&is=65c2fb18&hm=dfe49eddd9d55f29dd00a6d12e1bcc6e64218b7598b62827c32b15c5f0d466e3&`;
			expect(isUrl(url)).toBe(true);
		});

	});

	describe("isUrl() with wrapChars", () => {

		const wrapOptional = { wrapChars:`<>`, wrapOptional:true } as const;
		const wrapNonOptional = { wrapChars:`<>` } as const;

		test(`accepts an unwrapped url when wrap chars are optional`, () => {
			expect(isUrl(`http://gooGle.com/q?word=text#marked`, wrapOptional)).toBe(true);
			expect(isUrl(`https://google.com:80/q?word=text#marked`, wrapOptional)).toBe(true);
		});

		test(`rejects an unwrapped url when wrap chars are required`, () => {
			expect(isUrl(`http://gooGle.com/q?word=text#marked`, wrapNonOptional)).toBe(false);
			expect(isUrl(`https://google.com:80/q?word=text#marked`, wrapNonOptional)).toBe(false);
		});

		test(`accepts a wrapped url for both optional and required wrap chars`, () => {
			expect(isUrl(`<http://google.com/q?word=text#marked>`)).toBe(false);
			expect(isUrl(`<http://google.com/q?word=text#marked>`, wrapOptional)).toBe(true);
			expect(isUrl(`<http://google.com/q?word=text#marked>`, wrapNonOptional)).toBe(true);

			expect(isUrl(`<https://google.com:80/q?word=text#marked>`)).toBe(false);
			expect(isUrl(`<https://google.com:80/q?word=text#marked>`, wrapOptional)).toBe(true);
			expect(isUrl(`<https://google.com:80/q?word=text#marked>`, wrapNonOptional)).toBe(true);
		});

		test(`rejects invalid urls even when wrapped`, () => {
			expect(isUrl(`<ftps://google.com:80/q?word=text#marked>`)).toBe(false);
			expect(isUrl(`<ftps://google.com:80/q?word=text#marked>`, wrapOptional)).toBe(false);
			expect(isUrl(`<ftps://google.com:80/q?word=text#marked>`, wrapNonOptional)).toBe(false);
		});

		test(`rejects non-string values with options present`, () => {
			expect(isUrl(null, wrapOptional)).toBe(false);
			expect(isUrl(undefined, wrapNonOptional)).toBe(false);
			expect(isUrl(42, wrapOptional)).toBe(false);
		});

	});

});
