import type { RenderableContent as UtilsRenderableContent } from "@rsc-utils/render-utils";
import { RenderableContent } from '../data/RenderableContent.js';
import type { SourcedCore } from "./base/HasSource.js";
import { HasSource } from './base/HasSource.js';


export interface FaithCoreBase<T extends string = string> extends SourcedCore<T> {
	edicts: string[];
	anathema: string[];
}

export type FaithCore = FaithCoreBase<"Faith">;
/*// export interface FaithCore extends FaithCoreBase<"Faith"> { }*/

export class Faith<T extends string = "Faith", U extends FaithCoreBase<T> = FaithCoreBase<T>> extends HasSource<U, T> {

	/**************************************************************************************************************************/
	// Properties

	public get edicts(): string[] { return this.core.edicts ?? []; }
	public get anathema(): string[] { return this.core.anathema ?? []; }

	public toRenderableContent(): UtilsRenderableContent {
		const content = new RenderableContent(this);
		content.setTitle(`<b>${this.name}</b>`);
		this.appendDetailsTo(content);
		content.append(`<blockquote><b>Edicts</b> ${this.edicts.join(", ")}</blockquote>`);
		content.append(`<blockquote><b>Anathema</b> ${this.anathema.join(", ")}</blockquote>`);
		return content;
	}

}
