import type { RenderableContent } from "@rsc-utils/core-utils";
import { registerListeners } from "../../discord/handlers/registerListeners.js";
import { send } from "../../discord/messages.js";
import type { SageCache } from "../model/SageCache.js";
import type { SageInteraction } from "../model/SageInteraction.js";
import type { SageMessage } from "../model/SageMessage.js";
import { createCommandRenderableContent } from "./cmd.js";

async function createHelpRenderable(_caches: SageCache, _categories: string[]): Promise<RenderableContent> {
	const renderableContent = createCommandRenderableContent(`<b>Sage Help</b>`);
	renderableContent.appendSection(`<a href="https://rpgsage.io">RPG Sage Home</a>`, `<a href="https://github.com/rpg-sage-creative/rpg-sage/wiki">RPG Sage Wiki</a>`);
	return renderableContent;
}
//#endregion

// #region Render Help Text
async function renderHelpHandler(sageMessage: SageMessage): Promise<void> {
	const renderableContent = createCommandRenderableContent(`<b>RPG Sage Help</b>`);
	renderableContent.appendTitledSection("Slash Command", `/sage-help`);
	renderableContent.appendTitledSection("Guides", `<a href="https://rpgsage.io">RPG Sage Home</a>`, `<a href="https://github.com/rpg-sage-creative/rpg-sage/wiki">RPG Sage Wiki</a>`);
	await send(sageMessage.caches, sageMessage.message.channel, renderableContent, sageMessage.message.author);
}
// #endregion

//#region help slash commands

async function helpSlashHandler(sageInteraction: SageInteraction): Promise<void> {
	const categories = sageInteraction.args.getString("category")?.split(",") ?? [];
	const renderableContent = await createHelpRenderable(sageInteraction.caches, categories);
	return sageInteraction.reply(renderableContent, true);
}

//#endregion

export function registerHelpCommands(): void {
	registerListeners({ commands:["help"], interaction:helpSlashHandler, message:renderHelpHandler });
}
