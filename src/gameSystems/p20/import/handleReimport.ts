import type { Message } from "discord.js";
import { updateSheet } from "../../../sage-lib/sage/commands/pathbuilder.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { PathbuilderCharacter } from "../../../sage-pf2e/model/pc/PathbuilderCharacter.js";
import { handleReimport as _handleReimport } from "../../utils/io/handleReimport.js";
import { fetchCore } from "./fetchCore.js";

export async function handleReimport(sageCommand: SageCommand, message: Message, characterId: string): Promise<void> {
	const id = sageCommand.args.getNumber("id");
	if (id) {
		const content =
`
We are sorry, but reimporting your character directly from Pathbuilder 2e is disabled. Until we are able to support a safe way to reimport directly, we can only support manual reimports.
### Steps to reimport manually:
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
5. Reply to the message with your imported character
  - drag/drop or attach the file to your reply
  - type: \`sage! reimport\`
6. Send the reply to trigger a reimport
-# *for more help, visit us at <https://discord.gg/rpgsage>*
`;
		return sageCommand.replyStack.whisper({ content, ephemeral:true });
	}
	const { loadCharacter } = PathbuilderCharacter;
	await _handleReimport(sageCommand, message, characterId, { loadCharacter, fetchCore, updateSheet });
}