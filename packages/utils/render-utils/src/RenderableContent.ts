import { error, stringify, type Optional } from "@rsc-utils/core-utils";
import type { Renderable, RenderableContentSection, RenderableContentSectionColumn } from "./types.js";

function createSection(index = 0, title: string | null = null, content = <string[]>[], columns = <RenderableContentSectionColumn[]>[]): RenderableContentSection {
	return { index, title:title, content, columns };
}

type HexColorString = `#${string}`;

export class RenderableContent implements Renderable {
	private _sections: RenderableContentSection[] = [];
	private _appendSection(section: RenderableContentSection): RenderableContentSection {
		this._sections.push(section);
		return section;
	}

	public paragraphDelimiter = "\n";
	public thumbnailUrl: string | undefined;
	public color: HexColorString | undefined;

	public constructor(public title?: string) { }

	public get sections(): RenderableContentSection[] { return this._sections.slice(); }
	public get columnedSections(): RenderableContentSection[] { return this._sections.filter(s => s.columns?.length); }
	public get titledSections(): RenderableContentSection[] { return this._sections.filter(s => s.title); }
	public get untitledSections(): RenderableContentSection[] { return this._sections.filter(s => !s.title); }

	/** Append the given content to the last section. */
	public append(...content: string[]): void {
		const _sections = this._sections;
		const section = _sections.length
			? _sections[_sections.length - 1]
			: this._appendSection(createSection());
		section.content.push(...content);
	}

	/** Creates, appends, and returns a columned section. */
	public appendColumnedSection(...columns: RenderableContentSectionColumn[]): RenderableContentSection {
		return this._appendSection(createSection(this._sections.length, null, [], columns));
	}

	/** Creates, appends, and returns a titled section. */
	public appendTitledSection(title: string, ...content: string[]): RenderableContentSection {
		return this._appendSection(createSection(this._sections.length, title, content));
	}

	/** Creates, appends, and returns a section. */
	public appendSection(...content: string[]): RenderableContentSection {
		return this._appendSection(createSection(this._sections.length, null, content));
	}

	/** Append the given sections. */
	public appendSections(...sections: RenderableContentSection[]): void {
		const _sections = this._sections;
		_sections.push(...sections);
		_sections.forEach((section, index) => section.index = index);
	}

	/**
	 * Expects a RegExp with a global flag.
	 * Returns all unique matches.
	 */
	public findMatches(regex: RegExp): string[] {
		const matches: string[] = [];
		this.sections.forEach(section => {
			// TODO: see why i was gonna use this --> if (section.title) matches.push(...(section.title.match(regex) || []));
			section.content.forEach(s => matches.push(...(s.match(regex) || [])));
		});
		return matches.filter((s, i, a) => a.indexOf(s) === i);
	}

	/** Sets the border color. */
	public setColor(color: Optional<HexColorString>): void {
		this.color = color ?? undefined;
	}

	/** Sets the thumbnail image url. */
	public setThumbnailUrl(url: Optional<string>): void {
		this.thumbnailUrl = url ?? undefined;
	}

	/** Sets the title. */
	public setTitle(title: string): void {
		this.title = title;
	}

	/** The default renderer for a section. */
	protected renderSection(section: RenderableContentSection): string {
		const title = section.title ? `<h2>${section.title}</h2>` : ``;
		const contents = section.content.map(s => `<p>${s}</p>`).join("");
		return `${title}<div>${contents}</div>`;
	}

	/** Required to implement Renderable. By default returns "this". */
	public toRenderableContent(): RenderableContent {
		return this as RenderableContent;
	}

	/** Renders all contents to html. */
	public toString(): string {
		const title = this.title ? `<h1>${this.title}</h1>` : ``;
		const sections = this.sections.map(section => this.renderSection(section)).join("");
		return title + sections;
	}

	/** Resolve the given value to a RenderableContent. */
	public static resolve(resolvable: string | Renderable): RenderableContent | null {
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
				error(`Unable to resolve Renderable: ${toStringValue} (${constructorName}); "toRenderableContent in resolvable === ${"toRenderableContent" in resolvable}`, stringify(resolvable));
			}
		}

		return null;
	}

}
