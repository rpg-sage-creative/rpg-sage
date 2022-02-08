import type { SourcedCore } from "./base/HasSource";
import HasSource from "./base/HasSource";

export default class GearCategory extends HasSource<SourcedCore<"GearCategory">> {
	// public toRenderableContent(): utils.RenderUtils.RenderableContent {
	// 	let content = new RenderableContent(this);
	// 	content.setTitle(`<b>${this.name}</b> (Armor Group)`);
	// 	content.append(`<b>Specialization Effect</b>`);
	// 	content.append(...this.specializationEffect.map((d, i) => (i ? TAB : "") + d));
	// 	return content;
	// }
	// public toRenderableContentTitledSection(): utils.RenderUtils.TRenderableContentSection {
	// 	return <utils.RenderUtils.TRenderableContentSection>{
	// 		title: `<b>Specialization Effect</b> ${this.name}`,
	// 		content: this.specializationEffect.map((s, i) => (i ? TAB : "") + s)
	// 	};
	// }
}
