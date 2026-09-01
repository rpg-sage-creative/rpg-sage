import { EmbedColorType } from "@rsc-sage/data-layer";
import type { RenderableContent } from "@rsc-utils/core-utils";
import type { HasColorsCore } from "../../model/Colors.js";
import { createRenderableContent } from "./createRenderableContent.js";

export function createAdminRenderableContent(hasColors: HasColorsCore, title?: string): RenderableContent {
	return createRenderableContent(hasColors, EmbedColorType.AdminCommand, title);
}
