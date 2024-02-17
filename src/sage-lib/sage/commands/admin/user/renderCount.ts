import type { SageMessage } from "../../../model/SageMessage";
import { createAdminRenderableContent } from "../../cmd";

export function renderCount(sageMessage: SageMessage, label: string, count: number, active?: number): Promise<void> {
	const renderableContent = createAdminRenderableContent(sageMessage.bot, `<b>count-${label.toLowerCase()}</b>`);
	renderableContent.append(`<b>${label}</b> ${count}`);
	if ((active ?? false) !== false) {
		renderableContent.append(`<b>${label} (active)</b> ${active}`);
		renderableContent.append(`<b>${label} (inactive)</b> ${count - active!}`);
	}
	return <any>sageMessage.send(renderableContent);
}