import type { IRenderable } from "../sage-utils";
import type { RenderableContent } from "../sage-utils/utils/RenderUtils";

export interface IMenuRenderable extends IRenderable {
	getMenuLength(): number;
	getMenuUnicodeArray(): string[];
	toMenuRenderableContent(): RenderableContent;
	toMenuRenderableContent(index: number): RenderableContent;
}
