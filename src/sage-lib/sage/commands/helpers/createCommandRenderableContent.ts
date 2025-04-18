import type { RenderableContent } from "@rsc-utils/core-utils";
import { ActiveBot } from "../../model/ActiveBot.js";
import { ColorType } from "../../model/HasColorsCore.js";
import { createRenderableContent } from "./createRenderableContent.js";


export function createCommandRenderableContent(title?: string): RenderableContent {
	return createRenderableContent(ActiveBot.active, ColorType.Command, title);
}
