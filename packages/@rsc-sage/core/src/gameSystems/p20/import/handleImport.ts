import { postCharacter } from "../../../sage-lib/sage/commands/pathbuilder.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { handleImport as _handleImport } from "../../utils/io/handleImport.js";
import { fetchCores } from "./fetchCore.js";

export async function handleImport(sageCommand: SageCommand): Promise<void> {
	const importStatus = sageCommand.bot.getPathbuilderImportStatus();
	const id = sageCommand.args.getNumber("id");
	if (importStatus !== true && id) {
		const localize = sageCommand.getLocalizer();
		const statusLabel = typeof(importStatus) === "string" ? importStatus : localize("STILL_INVESTIGATING");
		const content = localize("PATHBUILDER_IMPORT_STATUS_S_X", statusLabel, id);
		return sageCommand.replyStack.whisper({ content, ephemeral:true });
	}
	return _handleImport(sageCommand, { fetchCores, postCharacter });
}