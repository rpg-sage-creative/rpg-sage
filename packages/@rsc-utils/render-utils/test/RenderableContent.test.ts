import { describe, expect, test } from "vitest";
import { RenderableContent } from "../build/index.js";

describe("RenderableContent", () => {

	describe("appending content", () => {

		test(`append() with no sections creates the first section`, () => {
			const rc = new RenderableContent();
			rc.append(`a`);
			expect(rc.sections).toEqual([{ index:0, title:undefined, content:[`a`], columns:[] }]);
		});

		test(`append() adds to only the last section`, () => {
			const rc = new RenderableContent();
			rc.appendSection(`one`);
			rc.appendSection(`two`);
			rc.append(`three`);
			expect(rc.sections[0].content).toEqual([`one`]);
			expect(rc.sections[1].content).toEqual([`two`, `three`]);
		});

		test(`appendBlock() wraps the first and last content items in blockquote tags`, () => {
			const rc = new RenderableContent();
			rc.appendBlock(`b1`, `b2`);
			expect(rc.sections[0].content).toEqual([`<blockquote>b1`, `b2</blockquote>`]);
		});

		test(`appendBlock() with a single item wraps it on both sides`, () => {
			const rc = new RenderableContent();
			rc.appendBlock(`solo`);
			expect(rc.sections[0].content).toEqual([`<blockquote>solo</blockquote>`]);
		});

		test(`appendBlock() with no content appends nothing and creates no section`, () => {
			const rc = new RenderableContent();
			rc.appendBlock();
			expect(rc.sections).toEqual([]);
		});

		test(`appendHeader() wraps the content in the given header tag`, () => {
			const rc = new RenderableContent();
			rc.appendHeader(`h3`, `head`);
			expect(rc.sections[0].content).toEqual([`<h3>head</h3>`]);
		});

		test(`section indexes increment as sections are added`, () => {
			const rc = new RenderableContent();
			rc.appendSection(`a`);
			rc.appendTitledSection(`t`, `b`);
			rc.appendColumnedSection({ title:`c1`, content:`x` });
			expect(rc.sections.map(s => s.index)).toEqual([0, 1, 2]);
		});

		test(`appendSections() appends and renumbers all indexes`, () => {
			const rc = new RenderableContent();
			rc.appendSection(`a`);
			const other = new RenderableContent();
			other.appendTitledSection(`ext`, `e`);
			rc.appendSections(...other.sections);
			expect(rc.sections.map(s => s.index)).toEqual([0, 1]);
			expect(rc.sections[1].title).toBe(`ext`);
		});

	});

	describe("section getters", () => {

		test(`sections returns a copy of the internal array`, () => {
			const rc = new RenderableContent();
			rc.appendSection(`a`);
			rc.sections.pop();
			expect(rc.sections.length).toBe(1);
		});

		test(`columnedSections filters to sections with columns`, () => {
			const rc = new RenderableContent();
			rc.appendSection(`plain`);
			rc.appendColumnedSection({ title:`c1`, content:`x` });
			expect(rc.columnedSections.length).toBe(1);
		});

		test(`titledSections and untitledSections split by title presence`, () => {
			const rc = new RenderableContent();
			rc.appendTitledSection(`titled`, `a`);
			rc.appendSection(`untitled`);
			expect(rc.titledSections.map(s => s.title)).toEqual([`titled`]);
			expect(rc.untitledSections.length).toBe(1);
		});

	});

	describe("findMatches", () => {

		test(`returns unique matches found across section content`, () => {
			const rc = new RenderableContent();
			rc.appendSection(`aaa aba`);
			rc.appendSection(`aba zzz`);
			expect(rc.findMatches(/a/g)).toEqual([`a`]);
		});

		test(`returns [] when nothing matches`, () => {
			const rc = new RenderableContent();
			rc.appendSection(`abc`);
			expect(rc.findMatches(/\d/g)).toEqual([]);
		});

	});

	describe("setters", () => {

		test(`setColor() sets and clears the color`, () => {
			const rc = new RenderableContent();
			rc.setColor(`#ff0000`);
			expect(rc.color).toBe(`#ff0000`);
			rc.setColor(null);
			expect(rc.color).toBe(undefined);
		});

		test(`setThumbnailUrl() sets and clears the url`, () => {
			const rc = new RenderableContent();
			rc.setThumbnailUrl(`http://example.com/i.png`);
			expect(rc.thumbnailUrl).toBe(`http://example.com/i.png`);
			rc.setThumbnailUrl(undefined);
			expect(rc.thumbnailUrl).toBe(undefined);
		});

		test(`setTitle() overrides the constructor title`, () => {
			const rc = new RenderableContent(`original`);
			rc.setTitle(`updated`);
			expect(rc.title).toBe(`updated`);
		});

	});

	describe("toString", () => {

		test(`renders an h1 title and p-wrapped content per section`, () => {
			const rc = new RenderableContent(`T`);
			rc.appendSection(`one`, `two`);
			expect(rc.toString()).toBe(`<h1>T</h1><div><p>one</p><p>two</p></div>`);
		});

		test(`a titled section renders an h2 before its content`, () => {
			const rc = new RenderableContent();
			rc.appendTitledSection(`Sec`, `body`);
			expect(rc.toString()).toBe(`<h2>Sec</h2><div><p>body</p></div>`);
		});

		test(`an untitled content-less render has no h1 or sections`, () => {
			expect(new RenderableContent().toString()).toBe(``);
		});

	});

	describe("toRenderableContent", () => {

		test(`returns itself`, () => {
			const rc = new RenderableContent();
			expect(rc.toRenderableContent()).toBe(rc);
		});

	});

	describe("resolve", () => {

		test(`a string resolves to a content with that single appended line`, () => {
			expect(RenderableContent.resolve(`hello`)?.toString()).toBe(`<div><p>hello</p></div>`);
		});

		test(`falsy values resolve to undefined`, () => {
			expect(RenderableContent.resolve(null as unknown as string)).toBe(undefined);
			expect(RenderableContent.resolve(``)).toBe(undefined);
		});

		test(`a Renderable resolves via its toRenderableContent()`, () => {
			const impl = { toRenderableContent(){ const c = new RenderableContent(`impl`); c.append(`i`); return c; } };
			expect(RenderableContent.resolve(impl)?.toString()).toBe(`<h1>impl</h1><div><p>i</p></div>`);
		});

		test(`a non-renderable object resolves to undefined`, () => {
			expect(RenderableContent.resolve({ nope:true } as unknown as RenderableContent)).toBe(undefined);
		});

	});

});
