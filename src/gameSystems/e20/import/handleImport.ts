import { postCharacter } from "../../../sage-lib/sage/commands/e20.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { handleImport as _handleImport } from "../../utils/handleImport.js";
import { fetchCore } from "./fetchCore.js";

export async function handleImport(sageCommand: SageCommand): Promise<void> {
	return _handleImport(sageCommand, {
		fetchHandler: fetchCore,
		postHandler: postCharacter
	});
}