import type { SageCommand } from "../../model/SageCommand.js";
import { createAdminRenderableContent } from "../cmd.js";

export async function renderCount(sageCommand: SageCommand, label: string, count: number, active?: number): Promise<void> {
	const renderableContent = createAdminRenderableContent(sageCommand.bot, `<b>${label} Count</b>`);
	renderableContent.append(`<b>${label}</b> ${count}`);
	if ((active ?? false) !== false) {
		renderableContent.append(`<b>${label} (active)</b> ${active}`);
		renderableContent.append(`<b>${label} (inactive)</b> ${count - active!}`);
	}
	await sageCommand.reply(renderableContent, true);
}