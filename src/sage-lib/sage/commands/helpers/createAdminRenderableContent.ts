import { RenderableContent } from "@rsc-utils/render-utils";
import type { IHasColorsCore } from "../../model/HasColorsCore";
import { ColorType } from "../../model/HasColorsCore";

export function createAdminRenderableContent(hasColors: IHasColorsCore, title?: string): RenderableContent {
	const renderableContent = new RenderableContent(title);
	renderableContent.setColor(hasColors.toDiscordColor(ColorType.AdminCommand));
	return renderableContent;
}

//#endregion
