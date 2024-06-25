import { RenderableContent } from "@rsc-utils/render-utils";
import type { IHasColorsCore } from "../../model/HasColorsCore";
import { ColorType } from "../../model/HasColorsCore";
import { createRenderableContent } from "./createRenderableContent";

export function createAdminRenderableContent(hasColors: IHasColorsCore, title?: string): RenderableContent {
	return createRenderableContent(hasColors, ColorType.AdminCommand, title);
}
