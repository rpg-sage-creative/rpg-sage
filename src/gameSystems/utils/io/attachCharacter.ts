import type { CharacterBase } from "@rsc-utils/character-utils";
import { error, errorReturnNull, type Optional } from "@rsc-utils/core-utils";
import type { MessageTarget } from "@rsc-utils/discord-utils";
import { AttachmentBuilder } from "discord.js";
import { resolveToEmbeds } from "../../../sage-lib/discord/resolvers/resolveToEmbeds.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";

export async function attachCharacter({ sageCache }: SageCommand, target: Optional<MessageTarget>, character: CharacterBase, pin: boolean): Promise<void> {
	if (!target) {
		return error(`Attaching a character without a target.`);
	}

	const content = `Attaching Character: ${character.name}`;
	const cleanCharName = character.name.replace(/\W+/g, "");

	const raw = resolveToEmbeds(sageCache, character.toHtml()).map(e => e.getDescription()).join("");
	const buffer = Buffer.from(raw, "utf-8");
	const options = { name:`${cleanCharName}.txt` };
	const attachment = new AttachmentBuilder(buffer, options);
	const files = [attachment];

	const message = await target.send({ content, files }).catch(errorReturnNull);

	if (pin && message?.pinnable) {
		await message.pin();
	}
}