import { tagLiterals } from "@rsc-utils/core-utils";
import { isUrl } from "../../build/index.js";

describe("url", () => {

	const wrapOptional = { wrapChars:"<>", wrapOptional:true };
	const wrapNonOptional = { wrapChars:"<>" };

	const goodUnwrappedUrls = [
		"http://gooGle.com/q?word=text#marked",
		"https://google.com:80/q?word=text#marked",
		"ftp://google.com:80/q?word=text#marked",
		"sftp://google.com:80/q?word=text#marked",
		"https://cdn.discordapp.com/attachments/1173111558428184678/1204632128369983578/image.png?ex=65d57018&is=65c2fb18&hm=dfe49eddd9d55f29dd00a6d12e1bcc6e64218b7598b62827c32b15c5f0d466e3&",
	];
	goodUnwrappedUrls.forEach(url => {
		test(tagLiterals`isUrl(${url}) === true`, () => {
			expect(isUrl(url)).toBe(true);
		});
		test(tagLiterals`isUrl(${url}, ${wrapOptional}) === true`, () => {
			expect(isUrl(url, wrapOptional)).toBe(true);
		});
		test(tagLiterals`isUrl(${url}, ${wrapNonOptional}) === false`, () => {
			expect(isUrl(url, wrapNonOptional)).toBe(false);
		});
	});

	const goodWrappedUrls = [
		"<http://google.com/q?word=text#marked>",
		"<https://google.com:80/q?word=text#marked>",
	];
	goodWrappedUrls.forEach(url => {
		test(tagLiterals`isUrl(${url}) === false`, () => {
			expect(isUrl(url)).toBe(false);
		});
		test(tagLiterals`isUrl(${url}, ${wrapOptional}) === true`, () => {
			expect(isUrl(url, wrapOptional)).toBe(true);
		});
		test(tagLiterals`isUrl(${url}, ${wrapNonOptional}) === true`, () => {
			expect(isUrl(url, wrapNonOptional)).toBe(true);
		});
	});

	const badUrls = [
		null,
		undefined,
		"",

		// port too long
		"https://google.com:655350/q?word=text#marked",

		// shttp not valid
		"shttp://google.com:80/q?word=text#marked",

		// ftps not valid
		"ftps://google.com:80/q?word=text#marked",
		"ftps://google.com/q?word=text#marked",
		"<ftps://google.com:80/q?word=text#marked>",
	];
	badUrls.forEach(url => {
		test(tagLiterals`isUrl(${url}) === false`, () => {
			expect(isUrl(url)).toBe(false);
		});
		test(tagLiterals`isUrl(${url}, ${wrapOptional}) === false`, () => {
			expect(isUrl(url, wrapOptional)).toBe(false);
		});
		test(tagLiterals`isUrl(${url}, ${wrapNonOptional}) === false`, () => {
			expect(isUrl(url, wrapNonOptional)).toBe(false);
		});
	});

});
