import { HasSource, type SourcedCore } from "./base/HasSource.js";

export class GearCategory extends HasSource<SourcedCore<"GearCategory">> {
	// public toRenderableContent(): RenderableContent {
	// 	let content = new RenderableContent(this);
	// 	content.setTitle(`<b>${this.name}</b> (Armor Group)`);
	// 	content.append(`<b>Specialization Effect</b>`);
	// 	content.append(...this.specializationEffect.map((d, i) => (i ? TAB : "") + d));
	// 	return content;
	// }
	// public toRenderableContentTitledSection(): RenderableContentSection {
	// 	return <RenderableContentSection>{
	// 		title: `<b>Specialization Effect</b> ${this.name}`,
	// 		content: this.specializationEffect.map((s, i) => (i ? TAB : "") + s)
	// 	};
	// }
}
