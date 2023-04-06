import { Optional } from "../../../../../sage-utils";
import { SageMessage } from "../../../model/SageMessage";
import { createAdminRenderableContent } from "../../cmd";

export async function sendNotFound(sageMessage: SageMessage, command: string, entityNamePlural: string, nameFilter?: Optional<string>): Promise<void> {
	const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `<b>${command}</b>`);
	if (nameFilter) {
		renderableContent.append(`<b>Filtered by:</b> ${nameFilter}`);
	}
	renderableContent.append(`<blockquote>No ${entityNamePlural} Found!</blockquote>`);
	await sageMessage.send(renderableContent);
}