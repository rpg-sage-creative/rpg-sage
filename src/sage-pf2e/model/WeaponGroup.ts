import type { RenderableContent, TRenderableContentSection } from "../../sage-utils/RenderUtils";
import { TAB } from "../common";
import { Pf2eRenderableContent } from "../Pf2eRenderableContent";
import { HasSource,  SourcedCore } from "./base/HasSource";

export interface WeaponGroupCore extends SourcedCore<"WeaponGroup"> {
	specializationEffect: string[];
}

export class WeaponGroup extends HasSource<WeaponGroupCore> {

	public get specializationEffect(): string[] {
		return this.core.specializationEffect ?? [];
	}

	public toRenderableContent(): RenderableContent {
		const content = new Pf2eRenderableContent(this);
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
