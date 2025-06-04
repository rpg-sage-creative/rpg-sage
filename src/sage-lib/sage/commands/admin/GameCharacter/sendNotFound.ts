import { quote } from "@rsc-utils/core-utils";
import type { SageMessage } from "../../../model/SageMessage.js";
import { createAdminRenderableContent } from "../../cmd.js";

export async function sendNotFound(sageMessage: SageMessage, command: string, entityNamePlural: string, { name, nameFilter }: { name?:string; nameFilter?: string }): Promise<void> {
	const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), `<b>${command}</b>`);
	if (name) {
		renderableContent.append(`<blockquote>${quote(name)} Not Found!</blockquote>`);

	}else {
		if (nameFilter) {
			renderableContent.append(`<b>Filtered by:</b> ${nameFilter}`);
		}
		renderableContent.append(`<blockquote>No ${entityNamePlural} Found!</blockquote>`);
	}
	await sageMessage.send(renderableContent);
}