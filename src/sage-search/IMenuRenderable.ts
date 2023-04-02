import type { IRenderable, RenderableContent } from "../sage-utils/RenderUtils";

/** An extended IRenderable meant to allow for menu selection. */
export interface IMenuRenderable extends IRenderable {
	/** How many items in the menu. */
	getMenuLength(): number;
	/** Array of unicode emoji 0-10 */
	getMenuUnicodeArray(): string[];
	/** Return renderable content for the main menu. */
	toMenuRenderableContent(): RenderableContent;
	/** Return renderable content for the item at the given index. */
	toMenuRenderableContent(index: number): RenderableContent;
}
