import { describe, expect, test } from "vitest";
import { matchDialogRegexPair } from "../../build/dialog/matchDialogRegexPair.js";

describe("dialog", () => {

	describe("matchDialogRegexPair urls", () => {

		test(`matches a bare dialog image url`, () => {
			const value = `:: dialog = https://cdn.discordapp.com/attachments/1/2/image.png ::`;
			const match = matchDialogRegexPair(value);
			expect(match?.key).toBe("dialogImageUrl");
			expect(match?.value).toBe(`https://cdn.discordapp.com/attachments/1/2/image.png`);
		});

		test(`matches a wrapped dialog image url`, () => {
			const value = `:: dialog = <https://cdn.discordapp.com/attachments/1/2/image.png> ::`;
			const match = matchDialogRegexPair(value);
			expect(match?.key).toBe("dialogImageUrl");
			expect(match?.value).toBe(`<https://cdn.discordapp.com/attachments/1/2/image.png>`);
		});

		test(`matches a bare embed image url`, () => {
			const value = `:: embed = http://a.com/x?y=1&z=2#frag ::`;
			const match = matchDialogRegexPair(value);
			expect(match?.key).toBe("embedImageUrl");
			expect(match?.value).toBe(`http://a.com/x?y=1&z=2#frag`);
		});

		test(`matches a bare url`, () => {
			const value = `:: https://a.com/path?q=b ::`;
			const match = matchDialogRegexPair(value);
			expect(match?.key).toBe("url");
			expect(match?.value).toBe(`https://a.com/path?q=b`);
		});

		test(`matches a wrapped url`, () => {
			const value = `:: <http://a.com> ::`;
			const match = matchDialogRegexPair(value);
			expect(match?.key).toBe("url");
			expect(match?.value).toBe(`<http://a.com>`);
		});

		test(`does not match an invalid url`, () => {
			const value = `:: ftps://a.com ::`;
			const match = matchDialogRegexPair(value);
			// falls through to the "other" pair rather than matching as a url
			expect(match?.key).toBe("other");
		});

	});

	describe("matchDialogRegexPair non-urls", () => {

		test(`matches post type`, () => {
			const match = matchDialogRegexPair(`:: post ::`);
			expect(match?.key).toBe("postType");
			expect(match?.value).toBe("post");
		});

		test(`falls through to other for plain content`, () => {
			const match = matchDialogRegexPair(`:: some other content ::`);
			expect(match?.key).toBe("other");
			expect(match?.value).toBe("some other content");
		});

	});

});
