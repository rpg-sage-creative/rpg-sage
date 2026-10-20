import { tagLiterals } from "@rsc-tools/dev-scripts";
import { describe, expect, test } from "vitest";
import { htmlToMarkdown } from "../../build/index.js";

type HtmlToMarkdownHandler = (innerHtml: string, attributes: Map<string, string>, nodeName: Lowercase<string>, outerHtml: string) => string;

type Test = {
	input: string;
	elementName: string;
	openMarkdown: string | HtmlToMarkdownHandler;
	expected: string;
};

describe("markdown", () => {
	describe("htmlToMarkdown", () => {

		const tests: Test[] = [
			{
				input: "this <blockquote>block quoted</blockquote> text",
				elementName: "blockquote",
				openMarkdown: (innerHtml: string) => "\n" + innerHtml.split("\n").map(s => "> " + s).join("\n") + "\n",
				expected:"this \n> block quoted\n text"
			},
			{ input:"this <b>bold</b> text", elementName:"b", openMarkdown:"**", expected:"this **bold** text" },
			{ input:"<b>bold</b> and <strong>strong</strong> text", elementName:"b", openMarkdown:"**", expected:"**bold** and <strong>strong</strong> text" },
			{ input:"<b>bold</b> and <strong>strong</strong> text", elementName:"strong", openMarkdown:"**", expected:"<b>bold</b> and **strong** text" },
		];

		tests.forEach(({ input, elementName, openMarkdown, expected }) => {
			test(tagLiterals`htmlToMarkdown(${input}, ${elementName}, ${openMarkdown}) === ${expected}`, () => {
				expect(htmlToMarkdown(input, elementName, openMarkdown as HtmlToMarkdownHandler)).toBe(expected);
			});
		});

	});
});