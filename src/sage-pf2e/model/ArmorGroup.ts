import type utils from "../../sage-utils";
import type { TRenderableContentSection } from "../../sage-utils";
import { TAB } from "../common";
import RenderableContent from "../data/RenderableContent";
import type { SourcedCore } from "./base/HasSource";
import HasSource from "./base/HasSource";

export interface IArmorGroup extends SourcedCore<"ArmorGroup"> {
	specializationEffect: string[];
}
export default class ArmorGroup extends HasSource<IArmorGroup> {
	public get specializationEffect(): string[] { return this.core.specializationEffect || []; }
	public toRenderableContent(): utils.RenderUtils.RenderableContent {
		const content = new RenderableContent(this);
		content.setTitle(`<b>${this.name}</b> (Armor Group)`);
		content.append(`<b>Specialization Effect</b>`);
		content.append(...this.specializationEffect.map((d, i) => (i ? TAB : "") + d));
		return content;
	}
	public toRenderableContentTitledSection(): TRenderableContentSection {
		return {
			title: `<b>Specialization Effect</b> ${this.name}`,
			content: this.specializationEffect.map((s, i) => (i ? TAB : "") + s)
		} as TRenderableContentSection;
	}

}
