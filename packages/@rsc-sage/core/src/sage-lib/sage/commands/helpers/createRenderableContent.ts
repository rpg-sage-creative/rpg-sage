import type { EmbedColorType } from "@rsc-sage/data";
import { RenderableContent } from "@rsc-utils/core-utils";
import type { HasColorsCore } from "../../model/Colors.js";

export function createRenderableContent(hasColors: HasColorsCore, colorType: EmbedColorType, title?: string): RenderableContent {
	const renderableContent = new RenderableContent(title);
	renderableContent.setColor(hasColors.toHexColorString(colorType));
	return renderableContent;
}