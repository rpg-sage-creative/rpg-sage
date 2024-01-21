import type { RenderableContentSection, RenderableContent as UtilsRenderableContent } from "@rsc-utils/render-utils";
import { TAB } from "../common";
import { RenderableContent } from "../data/RenderableContent";
import type { SourcedCore } from "./base/HasSource";
import { HasSource } from "./base/HasSource";

export interface ArmorGroupCore extends SourcedCore<"ArmorGroup"> {
	specializationEffect: string[];
}
export class ArmorGroup extends HasSource<ArmorGroupCore> {
	public get specializationEffect(): string[] { return this.core.specializationEffect || []; }
	public toRenderableContent(): UtilsRenderableContent {
		const content = new RenderableContent(this);
		content.setTitle(`<b>${this.name}</b> (Armor Group)`);
		content.append(`<b>Specialization Effect</b>`);
		content.append(...this.specializationEffect.map((d, i) => (i ? TAB : "") + d));
		return content;
	}
	public toRenderableContentTitledSection(): RenderableContentSection {
		return {
			title: `<b>Specialization Effect</b> ${this.name}`,
			content: this.specializationEffect.map((s, i) => (i ? TAB : "") + s)
		} as RenderableContentSection;
	}

}
