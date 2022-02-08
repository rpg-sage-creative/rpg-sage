import type utils from "../../sage-utils";
import type { TRenderableContentSection } from "../../sage-utils";
import { TAB } from "../common";
import RenderableContent from "../data/RenderableContent";
import HasSource, { SourcedCore } from "./base/HasSource";

export interface WeaponGroupCore extends SourcedCore<"WeaponGroup"> {
	specializationEffect: string[];
}

export default class WeaponGroup extends HasSource<WeaponGroupCore> {

	public get specializationEffect(): string[] {
		return this.core.specializationEffect ?? [];
	}

	public toRenderableContent(): utils.RenderUtils.RenderableContent {
		const content = new RenderableContent(this);
		content.setTitle(`<b>${this.name}</b> (Weapon Group)`);
		content.append(`<b>Critical Specialization Effect</b>`);
		content.append(...this.specializationEffect.map((s, i) => (i ? TAB : "") + s));
		return content;
	}

	public toRenderableContentTitledSection(): TRenderableContentSection {
		return {
			title: `<b>Critical Specialization Effect</b> ${this.name}`,
			content: this.specializationEffect.map((s, i) => (i ? TAB : "") + s)
		} as TRenderableContentSection;
	}

}
