import { postCharacter } from "../../../sage-lib/sage/commands/hephaistos.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { handleImport as _handleImport } from "../../utils/io/handleImport.js";
import { fetchCores } from "./fetchCore.js";

export async function handleImport(sageCommand: SageCommand): Promise<void> {
	return _handleImport(sageCommand, { fetchCores, postCharacter });
}