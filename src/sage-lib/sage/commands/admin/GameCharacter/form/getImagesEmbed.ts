import { EmbedBuilder, wrapUrl } from "@rsc-utils/discord-utils";
import type { GameCharacter } from "../../../../model/GameCharacter.js";

export function getImagesEmbed(char: GameCharacter): EmbedBuilder {
	const embed = new EmbedBuilder();
	if (char.avatarUrl) embed.setThumbnail(char.avatarUrl);
	embed.appendDescription(`**Token Url**\n- ${char.tokenUrl ? wrapUrl(char.tokenUrl) : `*none*`}`, "\n");
	embed.appendDescription(`**Avatar Url**\n- ${char.avatarUrl ? wrapUrl(char.avatarUrl) : `*none*`}`, "\n");
	return embed;
}