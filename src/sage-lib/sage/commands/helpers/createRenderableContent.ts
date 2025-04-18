import { RenderableContent } from "@rsc-utils/core-utils";
import type { ColorType, IHasColorsCore } from "../../model/HasColorsCore.js";

export function createRenderableContent(hasColors: IHasColorsCore, colorType: ColorType, title?: string): RenderableContent {
	const renderableContent = new RenderableContent(title);
	renderableContent.setColor(hasColors.toHexColorString(colorType));
	return renderableContent;
}