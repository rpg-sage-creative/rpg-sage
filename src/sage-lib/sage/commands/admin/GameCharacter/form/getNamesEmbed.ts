import { EmbedBuilder } from "@rsc-utils/discord-utils";
import type { GameCharacter } from "../../../../model/GameCharacter.js";

export function getNamesEmbed(char: GameCharacter): EmbedBuilder {
	const embed = new EmbedBuilder();
	embed.setTitle(char.name);
	if (char.tokenUrl) embed.setThumbnail(char.tokenUrl);
	embed.appendDescription(`**Nickname (aka)** ${char.aka ?? "*none*"}`, "\n");
	embed.appendDescription(`**Alias** ${char.alias ?? "*none*"}`, "\n");
	const { displayNameTemplate } = char;
	const displayName = char.toDisplayName();
	if (displayNameTemplate) {
		embed.appendDescription(`**Display Name**`, "\n");
		embed.appendDescription(`- Template: ${"`" + displayNameTemplate + "`"}`, "\n");
		embed.appendDescription(`- Output: ${displayName}`, "\n");
	}else {
		embed.appendDescription(`**Display Name**`, "\n");
		embed.appendDescription(`- Template: *none*`, "\n");
		embed.appendDescription(`- Output: ${displayName}`, "\n");
	}
	return embed;
}