import { captureRegExp, wrapExactRegExp } from "@rsc-utils/regexp-utils";
import { describe, expect, test } from "vitest";
import { AnchoredUrlRegExp, UrlRegExp, UrlRegExpG } from "../build/index.js";

describe("url", () => {

	describe("UrlRegExp", () => {

		test(`matches a full http url with query and anchor`, () => {
			expect(UrlRegExp.test(`http://google.com/q?word=text#marked`)).toBe(true);
			expect(String(UrlRegExp.exec(`http://google.com/q?word=text#marked`))).toBe(`http://google.com/q?word=text#marked`);
		});

		test(`matches a full https url with port`, () => {
			expect(UrlRegExp.test(`https://google.com:80/q?word=text#marked`)).toBe(true);
			expect(String(UrlRegExp.exec(`https://google.com:80/q?word=text#marked`))).toBe(`https://google.com:80/q?word=text#marked`);
		});

		test(`matches a full ftp url`, () => {
			expect(UrlRegExp.test(`ftp://google.com:80/q?word=text#marked`)).toBe(true);
			expect(String(UrlRegExp.exec(`ftp://google.com:80/q?word=text#marked`))).toBe(`ftp://google.com:80/q?word=text#marked`);
		});

		test(`matches a full sftp url`, () => {
			expect(UrlRegExp.test(`sftp://google.com:80/q?word=text#marked`)).toBe(true);
			expect(String(UrlRegExp.exec(`sftp://google.com:80/q?word=text#marked`))).toBe(`sftp://google.com:80/q?word=text#marked`);
		});

		test(`has no named capture groups by default`, () => {
			expect(UrlRegExp.exec(`http://google.com/q?word=text#marked`)?.groups).toBeUndefined();
		});

		test(`is case insensitive`, () => {
			expect(UrlRegExp.flags).toContain(`i`);
			expect(UrlRegExp.test(`HTTP://GOOGLE.COM`)).toBe(true);
		});

		test(`finds a url inside surrounding text when not anchored`, () => {
			expect(UrlRegExp.test(`s http://google.com:80/q?word=text#marked`)).toBe(true);
			expect(String(UrlRegExp.exec(`s http://google.com:80/q?word=text#marked`))).toBe(`http://google.com:80/q?word=text#marked`);
		});

		test(`extracts the valid prefix of an over-long port when not anchored`, () => {
			expect(UrlRegExp.test(`https://google.com:655350/q?word=text#marked`)).toBe(true);
			expect(String(UrlRegExp.exec(`https://google.com:655350/q?word=text#marked`))).toBe(`https://google.com:65535`);
		});

		test(`rejects shttp and ftps protocols`, () => {
			expect(UrlRegExp.test(`shttp://google.com:80/q?word=text#marked`)).toBe(false);
			expect(UrlRegExp.exec(`shttp://google.com:80/q?word=text#marked`)).toBeNull();
			expect(UrlRegExp.test(`ftps://google.com:80/q?word=text#marked`)).toBe(false);
			expect(UrlRegExp.exec(`ftps://google.com:80/q?word=text#marked`)).toBeNull();
		});

	});

	describe("AnchoredUrlRegExp", () => {

		test(`requires the entire value to be a url`, () => {
			expect(AnchoredUrlRegExp.test(`http://google.com/q?word=text#marked`)).toBe(true);
			expect(AnchoredUrlRegExp.test(`s http://google.com:80/q?word=text#marked`)).toBe(false);
			expect(AnchoredUrlRegExp.exec(`s http://google.com:80/q?word=text#marked`)).toBeNull();
		});

		test(`rejects an over-long port`, () => {
			expect(AnchoredUrlRegExp.test(`https://google.com:655350/q?word=text#marked`)).toBe(false);
			expect(AnchoredUrlRegExp.exec(`https://google.com:655350/q?word=text#marked`)).toBeNull();
		});

		test(`keeps the flags of UrlRegExp`, () => {
			expect(AnchoredUrlRegExp.flags).toBe(UrlRegExp.flags);
		});

	});

	describe("UrlRegExpG", () => {

		test(`is a global clone of UrlRegExp`, () => {
			expect(UrlRegExpG.global).toBe(true);
			expect(UrlRegExp.global).toBe(false);
		});

		test(`finds every url in a string`, () => {
			const text = `see http://a.com/x and https://b.com/y end`;
			const matches = [...text.matchAll(UrlRegExpG)];
			expect(matches.map(match => match[0])).toEqual([`http://a.com/x`, `https://b.com/y`]);
		});

	});

	describe("composed url regexes", () => {

		test(`wrapExactRegExp with optional accepts wrapped and unwrapped urls`, () => {
			const regex = wrapExactRegExp(UrlRegExp, `<>`, { optional:true });
			expect(regex.test(`http://google.com/q?word=text#marked`)).toBe(true);
			expect(regex.exec(`http://google.com/q?word=text#marked`)?.[0]).toBe(`http://google.com/q?word=text#marked`);
			expect(regex.test(`<https://google.com:80/q?word=text#marked>`)).toBe(true);
			expect(regex.exec(`<https://google.com:80/q?word=text#marked>`)?.[0]).toBe(`<https://google.com:80/q?word=text#marked>`);
		});

		test(`wrapExactRegExp without optional requires the wrap chars`, () => {
			const regex = wrapExactRegExp(UrlRegExp, `<>`);
			expect(regex.test(`<http://google.com/q?word=text#marked>`)).toBe(true);
			expect(regex.exec(`<http://google.com/q?word=text#marked>`)?.[0]).toBe(`<http://google.com/q?word=text#marked>`);
			expect(regex.test(`http://google.com/q?word=text#marked`)).toBe(false);
			expect(regex.exec(`http://google.com/q?word=text#marked`)).toBeNull();
		});

		test(`wrapExactRegExp supports other wrap chars`, () => {
			const regex = wrapExactRegExp(UrlRegExp, `[]`);
			expect(regex.test(`[http://a.com]`)).toBe(true);
			expect(regex.test(`<http://a.com>`)).toBe(false);
		});

		test(`captureRegExp captures the wrapped url into a named group`, () => {
			const regex = captureRegExp(wrapExactRegExp(UrlRegExp, `<>`, { optional:true }), `url`);
			expect(regex.exec(`x <http://a.com> y`)?.groups?.url).toBe(`<http://a.com>`);
			expect(regex.exec(`x http://a.com y`)?.groups?.url).toBe(`http://a.com`);
		});

		test(`captures a discord attachment url with optional wrap chars`, () => {
			const regex = captureRegExp(wrapExactRegExp(UrlRegExp, `<>`, { optional:true }), `url`);
			const url = `https://cdn.discordapp.com/attachments/1173111558428184678/1204632128369983578/image.png?ex=65d57018&is=65c2fb18&hm=dfe49eddd9d55f29dd00a6d12e1bcc6e64218b7598b62827c32b15c5f0d466e3&`;
			expect(regex.exec(url)?.groups?.url).toBe(url);
		});

	});

});
