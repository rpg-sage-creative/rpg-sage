import type { MessageTarget } from "@rsc-utils/discord-utils";
import type { SageCommand } from "../../sage-lib/sage/model/SageCommand.js";
import type { CharacterBase } from "@rsc-utils/character-utils";
import { resolveToEmbeds } from "../../sage-lib/discord/resolvers/resolveToEmbeds.js";
import { AttachmentBuilder } from "discord.js";
import { error, errorReturnNull, type Optional } from "@rsc-utils/core-utils";

export async function attachCharacter({ sageCache }: SageCommand, target: Optional<MessageTarget>, attachmentName: string, character: CharacterBase, pin: boolean): Promise<void> {
	if (!target) {
		error(`Attaching a character without a target.`);
		return;
	}

	const content = `Attaching Character: ${character.name}`;

	const raw = resolveToEmbeds(sageCache, character.toHtml()).map(e => e.getDescription()).join("");
	const buffer = Buffer.from(raw, "utf-8");
	const options = { name:`${attachmentName}.txt` };
	const attachment = new AttachmentBuilder(buffer, options);
	const files = [attachment];

	const message = await target.send({ content, files }).catch(errorReturnNull);

	if (pin && message?.pinnable) {
		await message.pin();
	}
}