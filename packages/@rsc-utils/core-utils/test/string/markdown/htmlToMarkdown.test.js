import { toLiteral } from "../../../build/index.js";
import { htmlToMarkdown } from "../../../build/index.js";

describe("string", () => {
	describe("markdown", () => {
		describe("htmlToMarkdown", () => {

			const tests = [
				{ input:"this <blockquote>block quoted</blockquote> text", elementName:"blockquote", openMarkdown:innerHtml => "\n" + innerHtml.split("\n").map(s => "> " + s).join("\n") + "\n", expected:"this \n> block quoted\n text" },
				{ input:"this <b>bold</b> text", elementName:"b", openMarkdown:"**", expected:"this **bold** text" },
				{ input:"<b>bold</b> and <strong>strong</strong> text", elementName:"b", openMarkdown:"**", expected:"**bold** and <strong>strong</strong> text" },
				{ input:"<b>bold</b> and <strong>strong</strong> text", elementName:"strong", openMarkdown:"**", expected:"<b>bold</b> and **strong** text" },
			];

			tests.forEach(({ input, elementName, openMarkdown, expected }) => {
				test(`htmlToMarkdown(${toLiteral(input)}, ${toLiteral(elementName)}, ${toLiteral(openMarkdown)}) === ${toLiteral(expected)}`, () => {
					expect(htmlToMarkdown(input, elementName, openMarkdown)).toBe(expected);
				});
			});

		});
	});
});