import { describe, expect, test } from "vitest";
import { getUrlRegex, UrlRegExp, UrlRegExpG } from "../build/index.js";

describe("url", () => {

	describe("getUrlRegex()", () => {

		test(`matches a full http url with query and anchor`, () => {
			const regex = getUrlRegex();
			expect(regex.test(`http://google.com/q?word=text#marked`)).toBe(true);
			expect(String(regex.exec(`http://google.com/q?word=text#marked`))).toBe(`http://google.com/q?word=text#marked`);
		});

		test(`matches a full https url with port`, () => {
			const regex = getUrlRegex();
			expect(regex.test(`https://google.com:80/q?word=text#marked`)).toBe(true);
			expect(String(regex.exec(`https://google.com:80/q?word=text#marked`))).toBe(`https://google.com:80/q?word=text#marked`);
		});

		test(`matches a full ftp url`, () => {
			const regex = getUrlRegex();
			expect(regex.test(`ftp://google.com:80/q?word=text#marked`)).toBe(true);
			expect(String(regex.exec(`ftp://google.com:80/q?word=text#marked`))).toBe(`ftp://google.com:80/q?word=text#marked`);
		});

		test(`matches a full sftp url`, () => {
			const regex = getUrlRegex();
			expect(regex.test(`sftp://google.com:80/q?word=text#marked`)).toBe(true);
			expect(String(regex.exec(`sftp://google.com:80/q?word=text#marked`))).toBe(`sftp://google.com:80/q?word=text#marked`);
		});

		test(`has no named capture groups by default`, () => {
			expect(getUrlRegex().exec(`http://google.com/q?word=text#marked`)?.groups).toBeUndefined();
		});

		test(`is case insensitive`, () => {
			expect(getUrlRegex().flags).toContain(`i`);
			expect(getUrlRegex().test(`HTTP://GOOGLE.COM`)).toBe(true);
		});

	});

	describe("getUrlRegex({ capture })", () => {

		test(`captures the url into the named group`, () => {
			const regex = getUrlRegex({ capture:`url` });
			const match = regex.exec(`x http://google.com/q?word=text#marked y`);
			expect(match?.[0]).toBe(`http://google.com/q?word=text#marked`);
			expect(match?.groups?.url).toBe(`http://google.com/q?word=text#marked`);
		});

		test(`captures ftp and sftp urls too`, () => {
			const regex = getUrlRegex({ capture:`url` });
			expect(regex.exec(`ftp://google.com:80/q?word=text#marked`)?.groups?.url).toBe(`ftp://google.com:80/q?word=text#marked`);
			expect(regex.exec(`sftp://google.com:80/q?word=text#marked`)?.groups?.url).toBe(`sftp://google.com:80/q?word=text#marked`);
		});

	});

	describe("anchoring", () => {

		test(`finds a url inside surrounding text when not anchored`, () => {
			const regex = getUrlRegex();
			expect(regex.test(`s http://google.com:80/q?word=text#marked`)).toBe(true);
			expect(String(regex.exec(`s http://google.com:80/q?word=text#marked`))).toBe(`http://google.com:80/q?word=text#marked`);
		});

		test(`rejects leading text when anchored`, () => {
			const regex = getUrlRegex({ anchored:true });
			expect(regex.test(`s http://google.com:80/q?word=text#marked`)).toBe(false);
			expect(regex.exec(`s http://google.com:80/q?word=text#marked`)).toBeNull();
		});

		test(`extracts the valid prefix of an over-long port when not anchored`, () => {
			const regex = getUrlRegex();
			expect(regex.test(`https://google.com:655350/q?word=text#marked`)).toBe(true);
			expect(String(regex.exec(`https://google.com:655350/q?word=text#marked`))).toBe(`https://google.com:65535`);
		});

		test(`rejects an over-long port when anchored`, () => {
			const regex = getUrlRegex({ anchored:true });
			expect(regex.test(`https://google.com:655350/q?word=text#marked`)).toBe(false);
			expect(regex.exec(`https://google.com:655350/q?word=text#marked`)).toBeNull();
		});

		test(`rejects shttp and ftps protocols`, () => {
			const regex = getUrlRegex();
			expect(regex.test(`shttp://google.com:80/q?word=text#marked`)).toBe(false);
			expect(regex.exec(`shttp://google.com:80/q?word=text#marked`)).toBeNull();
			expect(regex.test(`ftps://google.com:80/q?word=text#marked`)).toBe(false);
			expect(regex.exec(`ftps://google.com:80/q?word=text#marked`)).toBeNull();
		});

	});

	describe("caching", () => {

		test(`returns the same cached instance for repeated non-global calls`, () => {
			expect(getUrlRegex()).toBe(getUrlRegex());
			expect(getUrlRegex({ anchored:true })).toBe(getUrlRegex({ anchored:true }));
			expect(getUrlRegex()).not.toBe(getUrlRegex({ anchored:true }));
		});

		test(`returns a new instance for each gFlag call`, () => {
			const first = getUrlRegex({ gFlag:`g` });
			const second = getUrlRegex({ gFlag:`g` });
			expect(first).not.toBe(second);
			expect(first.global).toBe(true);
		});

		test(`finds every url in a string with the global flag`, () => {
			const text = `see http://a.com/x and https://b.com/y end`;
			const matches = [...text.matchAll(getUrlRegex({ gFlag:`g` }))];
			expect(matches.map(match => match[0])).toEqual([`http://a.com/x`, `https://b.com/y`]);
		});

		test(`exports UrlRegExp as non-global and UrlRegExpG as global`, () => {
			expect(UrlRegExp.global).toBe(false);
			expect(UrlRegExpG.global).toBe(true);
		});

	});

	describe("wrapChars", () => {

		const wrapRegex = getUrlRegex({ wrapChars:`<>` });

		test(`requires the wrap chars when wrapOptional is not set`, () => {
			expect(wrapRegex.test(`<http://google.com/q?word=text#marked>`)).toBe(true);
			expect(wrapRegex.exec(`<http://google.com/q?word=text#marked>`)?.[0]).toBe(`<http://google.com/q?word=text#marked>`);
			expect(wrapRegex.test(`<https://google.com:80/q?word=text#marked>`)).toBe(true);
			expect(wrapRegex.exec(`<https://google.com:80/q?word=text#marked>`)?.[0]).toBe(`<https://google.com:80/q?word=text#marked>`);
		});

		test(`rejects unwrapped urls when wrap chars are required`, () => {
			expect(wrapRegex.test(`http://google.com/q?word=text#marked`)).toBe(false);
			expect(wrapRegex.exec(`http://google.com/q?word=text#marked`)).toBeNull();
			expect(wrapRegex.test(`https://google.com:80/q?word=text#marked`)).toBe(false);
			expect(wrapRegex.exec(`https://google.com:80/q?word=text#marked`)).toBeNull();
		});

		test(`supports other wrap chars`, () => {
			const bracketWrap = getUrlRegex({ wrapChars:`[]` });
			expect(bracketWrap.test(`[http://a.com]`)).toBe(true);
			expect(bracketWrap.test(`<http://a.com>`)).toBe(false);
		});

	});

	describe("wrapOptional", () => {

		const wrapOptionalRegex = getUrlRegex({ wrapChars:`<>`, wrapOptional:true });

		test(`accepts both wrapped and unwrapped urls`, () => {
			expect(wrapOptionalRegex.test(`http://google.com/q?word=text#marked`)).toBe(true);
			expect(wrapOptionalRegex.exec(`http://google.com/q?word=text#marked`)?.[0]).toBe(`http://google.com/q?word=text#marked`);
			expect(wrapOptionalRegex.test(`<https://google.com:80/q?word=text#marked>`)).toBe(true);
			expect(wrapOptionalRegex.exec(`<https://google.com:80/q?word=text#marked>`)?.[0]).toBe(`<https://google.com:80/q?word=text#marked>`);
		});

		test(`still rejects invalid urls wrapped or not`, () => {
			expect(wrapOptionalRegex.test(`ftps://google.com/q?word=text#marked`)).toBe(false);
			expect(wrapOptionalRegex.exec(`ftps://google.com/q?word=text#marked`)).toBeNull();
			expect(wrapOptionalRegex.test(`<ftps://google.com:80/q?word=text#marked>`)).toBe(false);
			expect(wrapOptionalRegex.exec(`<ftps://google.com:80/q?word=text#marked>`)).toBeNull();
		});

		test(`works together with anchored`, () => {
			const anchoredWrapOptional = getUrlRegex({ anchored:true, wrapChars:`<>`, wrapOptional:true });
			expect(anchoredWrapOptional.test(`<http://a.com>`)).toBe(true);
			expect(anchoredWrapOptional.test(`http://a.com`)).toBe(true);

			const discordAttachmentUrl = `https://cdn.discordapp.com/attachments/1173111558428184678/1204632128369983578/image.png?ex=65d57018&is=65c2fb18&hm=dfe49eddd9d55f29dd00a6d12e1bcc6e64218b7598b62827c32b15c5f0d466e3&`;
			expect(anchoredWrapOptional.test(discordAttachmentUrl)).toBe(true);
			expect(anchoredWrapOptional.exec(discordAttachmentUrl)?.[0]).toBe(discordAttachmentUrl);
		});

	});

});
