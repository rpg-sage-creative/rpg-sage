import type { Optional } from "..";
import { unique } from "../ArrayUtils";

//#region types

export enum TDisplayType { Unset = 0, Compact = 1, Cozy = 2 }

export interface IRenderable {
	toRenderableContent(): RenderableContent;
}

export type TRenderableContentSection = {
	content: string[];
	index: number;
	title: string | null;
	columns: TRenderableContentSectionColumn[];
};

export type TRenderableContentSectionColumn = {
	title: string;
	content: string;
};

export type TRenderableContentResolvable = string | IRenderable | RenderableContent;

//#endregion

//#region helpers

function createSection(index = 0, title: string | null = null, content = <string[]>[], columns = <TRenderableContentSectionColumn[]>[]): TRenderableContentSection {
	return { index, title:title, content, columns };
}

//#endregion

/**
 * This represents content that can be rendered as HTML so that it can be parsed and formatted for other markups (or Markdown in the case of Discord; the original reason this was written).
 */
export class RenderableContent implements IRenderable {
	private _sections: TRenderableContentSection[] = [];
	private _appendSection(section: TRenderableContentSection): TRenderableContentSection {
		this._sections.push(section);
		return section;
	}

	public paragraphDelimiter = "\n";
	public thumbnailUrl: string | undefined;
	public color: string | undefined;
	public display = TDisplayType.Unset;

	public constructor(public title?: string) { }

	public get sections(): TRenderableContentSection[] { return this._sections.slice(); }
	public get columnedSections(): TRenderableContentSection[] { return this._sections.filter(s => s.columns?.length); }
	public get titledSections(): TRenderableContentSection[] { return this._sections.filter(s => s.title); }
	public get untitledSections(): TRenderableContentSection[] { return this._sections.filter(s => !s.title); }

	public append(...content: string[]): void {
		const _sections = this._sections;
		const section = _sections.length
			? _sections[_sections.length - 1]
			: this._appendSection(createSection());
		section.content.push(...content);
	}

	public appendColumnedSection(...columns: TRenderableContentSectionColumn[]): TRenderableContentSection {
		return this._appendSection(createSection(this._sections.length, null, [], columns));
	}

	public appendTitledSection(title: string, ...content: string[]): TRenderableContentSection {
		return this._appendSection(createSection(this._sections.length, title, content));
	}

	public appendSection(...content: string[]): TRenderableContentSection {
		return this._appendSection(createSection(this._sections.length, null, content));
	}

	public appendSections(...sections: TRenderableContentSection[]): void {
		const _sections = this._sections;
		_sections.push(...sections);
		_sections.forEach((section, index) => section.index = index);
	}

	public findMatches(regex: RegExp): string[] {
		const matches: string[] = [];
		this.sections.forEach(section => {
			// TODO: see why i was gonna use this --> if (section.title) matches.push(...(section.title.match(regex) || []));
			section.content.forEach(s => matches.push(...(s.match(regex) || [])));
		});
		return matches.filter(unique);
	}

	public setColor(color: Optional<string>): void {
		this.color = color ?? undefined;
	}

	public setThumbnailUrl(url: Optional<string>): void {
		this.thumbnailUrl = url ?? undefined;
	}

	public setTitle(title: string): void {
		this.title = title;
	}

	protected renderSection(section: TRenderableContentSection): string {
		const title = section.title ? `<h2>${section.title}</h2>` : ``;
		const contents = section.content.map(s => `<p>${s}</p>`).join("");
		return `${title}<div>${contents}</div>`;
	}

	public toRenderableContent(): RenderableContent {
		return this;
	}

	public toString(): string {
		const title = this.title ? `<h1>${this.title}</h1>` : ``;
		const sections = this.sections.map(section => this.renderSection(section)).join("");
		return title + sections;
	}

	public static resolve(resolvable: Optional<TRenderableContentResolvable>): RenderableContent | null {
		if (!resolvable) {
			return null;
		}

		if (typeof(resolvable) === "string") {
			const renderableContent = new RenderableContent();
			renderableContent.append(resolvable);
			return renderableContent;

		}else {
			try {
				return resolvable.toRenderableContent();
			}catch(ex) {
				const toStringValue = Object.prototype.toString.call(resolvable) ?? "No toString";
				const constructorName = resolvable?.constructor?.name ?? "No Constructor";
				console.error(`Unable to resolve IRenderable: ${toStringValue} (${constructorName}); "toRenderableContent in resolvable === ${"toRenderableContent" in resolvable}`, JSON.stringify(resolvable));
			}
		}

		return null;
	}

}
