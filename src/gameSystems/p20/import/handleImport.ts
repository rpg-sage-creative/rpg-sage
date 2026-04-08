import { postCharacter } from "../../../sage-lib/sage/commands/pathbuilder.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { handleImport as _handleImport } from "../../utils/io/handleImport.js";
import { fetchCores } from "./fetchCore.js";

export async function handleImport(sageCommand: SageCommand): Promise<void> {
	const id = sageCommand.args.getNumber("id");
	if (id) {
		const content =
`
We are sorry, but importing your character directly from Pathbuilder 2e is disabled. Until we are able to support a safe way to import directly, we can only support manual imports.
### Steps to import manually:
1. Open your browser to <https://pathbuilder2e.com/json.php?id=${id}>
2. Copy all the json content on that page
  - macOS cmd + a then cmd + c
  - Win ctrl + a then ctrl + c
3. Create a simple plain text file
  - any name will do, as long as it ends with \`.json\`
  - for simplicity, you can use \`${id}.json\`
4. Paste all the json into the file
  - macOS cmd + v
  - Win ctrl + v
5. Start a new discord message
  - drag/drop or attach the file to the message
  - for Pathfinder 2e, type: \`sage! import pf2e\`
  - for Starfinder 2e, type: \`sage! import sf2e\`
6. Send the message to trigger an import
-# *for more help, visit us at <https://discord.gg/rpgsage>*
`;
		return sageCommand.replyStack.whisper({ content, ephemeral:true });
	}
	return _handleImport(sageCommand, { fetchCores, postCharacter });
}