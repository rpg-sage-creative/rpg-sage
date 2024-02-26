import { RenderableContent } from "@rsc-utils/render-utils";
import type { ColorType, IHasColorsCore } from "../../model/HasColorsCore";

export function createRenderableContent(hasColors: IHasColorsCore, colorType: ColorType, title?: string): RenderableContent {
	const renderableContent = new RenderableContent(title);
	renderableContent.setColor(hasColors.toDiscordColor(colorType));
	return renderableContent;
}