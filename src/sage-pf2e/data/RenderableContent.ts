import type { RenderableContentSection } from "@rsc-utils/render-utils";
import { RenderableContent as UtilsRenderableContent } from "@rsc-utils/render-utils";
import { NEWLINE, TAB } from "../common";
import type { Base } from "../model/base/Base";
import type { HasSource } from "../model/base/HasSource";

type TRenderable = Base | HasSource;

export class RenderableContent extends UtilsRenderableContent {

	private _aonLinksSection?: RenderableContentSection;
	private get aonLinksSection(): RenderableContentSection {
		if (!this._aonLinksSection) {
			this._aonLinksSection = { index: -1, title: `<b>Archives of Nethys</b>`, content: [], columns: [] };
		}
		return this._aonLinksSection;
	}

	private _sourceSection?: RenderableContentSection;
	private get sourceSection(): RenderableContentSection {
		if (!this._sourceSection) {
			this._sourceSection = { index: -1, title: `<b>Source</b>`, content: [], columns: [] };
		}
		return this._sourceSection;
	}

	private _otherLinksSection?: RenderableContentSection;
	private get otherLinksSection(): RenderableContentSection {
		if (!this._otherLinksSection) {
			this._otherLinksSection = { index: -1, title: `<b>Links</b>`, content: [], columns: [] };
		}
		return this._otherLinksSection;
	}

	public constructor();
	public constructor(item: TRenderable);
	public constructor(item: TRenderable, addLink: boolean);
	public constructor(item?: TRenderable, addLink = true) {
		super();
		if (item) {
			const source = (<HasSource>item).source;
			if (source) {
				this.setSource(source.name, (<HasSource>item).pages);
				this.addSourceLink(source.toAonLink(), source.toLink());
			}
			if (addLink) {
				this.addAonLink(item.toAonLink());
				this.addOtherLink(item.toLink());
			}
		}

	}

	public get sections(): RenderableContentSection[] {
		const sections = super.sections;
		if (this._sourceSection) {
			this._sourceSection.index = sections.length;
			sections.push(this._sourceSection);
		}
		if (this._aonLinksSection) {
			this._aonLinksSection.index = sections.length;
			sections.push(this._aonLinksSection);
		}
		if (this._otherLinksSection) {
			this._otherLinksSection.index = sections.length;
			sections.push(this._otherLinksSection);
		}
		return sections;
	}

	public appendParagraphs(input: string[], label?: string): void {
		if (input?.length) {
			this.append(...RenderableContent.toParagraphs(input, label));
		}
	}

	public appendParagraphsSection(input: string[], label?: string): void {
		if (input?.length) {
			this.appendSection(...RenderableContent.toParagraphs(input, label));
		}
	}

	public appendBlockquote(input: string[], label?: string): void {
		if (input?.length) {
			this.append(`<blockquote>${RenderableContent.toParagraphs(input, label).join(NEWLINE)}</blockquote>`);
		}
	}

	public addAonLink(...links: string[]): void {
		this.aonLinksSection.content.push(...links.filter(s => s?.trim()));
	}

	public addOtherLink(...links: string[]): void {
		this.otherLinksSection.content.push(...links.filter(s => s?.trim()));
	}

	public addSourceLink(...links: string[]): void {
		this.sourceSection.content.push(...links.filter(s => s?.trim()));
	}

	public setSource(sourceName: string, sourcePages?: string[], link?: string): void {
		const pageInfo = sourcePages?.length ? ` pg ${sourcePages.join(", ")}` : "";
		this.sourceSection.title = `<b>Source:</b> ${sourceName}${pageInfo}`;
		if (link) {
			this.sourceSection.content.push(link);
		}
	}

	public static toParagraphs(input: string[], label?: string): string[] {
		const boldLabel = label && label !== NEWLINE ? `<b>${label}</b> ` : label ?? ``;
		return (input ?? []).map((s, i) => (i ? TAB : boldLabel) + s);
	}
}
