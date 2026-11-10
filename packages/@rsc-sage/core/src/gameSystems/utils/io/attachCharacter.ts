import type { SupportedTarget } from "@rsc-chat/discord-utils";
import type { Optional } from "@rsc-utils/type-utils";
import type { CharacterBase } from "@rsc-sage/game";
import { Logger, errorReturnUndefined } from "@rsc-utils/logger-utils";
import { AttachmentBuilder } from "discord.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";

export async function attachCharacter({ eventCache }: SageCommand, target: Optional<SupportedTarget>, character: CharacterBase, pin: boolean): Promise<void> {
	if (!target) {
		return Logger.package("@rsc-sage/core").error(`Attaching a character without a target.`);
	}

	const content = `Attaching Character: ${character.name}`;
	const cleanCharName = character.name.replace(/\W+/g, "");

	const raw = eventCache.resolveToEmbeds(character.toHtml()).map(e => e.getDescription()).join("");
	const buffer = Buffer.from(raw, "utf-8");
	const options = { name:`${cleanCharName}.txt` };
	const attachment = new AttachmentBuilder(buffer, options);
	const files = [attachment];

	const message = await target.send({ content, files }).catch(errorReturnUndefined);

	if (pin && message?.pinnable) {
		await message.pin();
	}
}