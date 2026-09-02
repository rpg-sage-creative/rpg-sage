import { EmbedColorType } from "@rsc-sage/data-layer";
import type { RenderableContent } from "@rsc-utils/core-utils";
import { ActiveBot } from "../../model/ActiveBot.js";
import { createRenderableContent } from "./createRenderableContent.js";


export function createCommandRenderableContent(title?: string): RenderableContent {
	return createRenderableContent(ActiveBot.active, EmbedColorType.Command, title);
}
