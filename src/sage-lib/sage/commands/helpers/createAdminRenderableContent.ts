import type { RenderableContent } from "@rsc-utils/core-utils";
import type { IHasColorsCore } from "../../model/HasColorsCore.js";
import { ColorType } from "../../model/HasColorsCore.js";
import { createRenderableContent } from "./createRenderableContent.js";

export function createAdminRenderableContent(hasColors: IHasColorsCore, title?: string): RenderableContent {
	return createRenderableContent(hasColors, ColorType.AdminCommand, title);
}
