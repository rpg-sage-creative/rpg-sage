import { RenderableContent } from "@rsc-utils/render-utils";
import { ActiveBot } from "../../model/ActiveBot";
import { ColorType } from "../../model/HasColorsCore";
import { createRenderableContent } from "./createRenderableContent";


export function createCommandRenderableContent(title?: string): RenderableContent {
	return createRenderableContent(ActiveBot.active, ColorType.Command, title);
}
